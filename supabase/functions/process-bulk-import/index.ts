import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportJob {
  id: string
  file_path: string
  template_selection: any
  created_by: string
}

Deno.serve(async (req) => {
  console.log('=== BULK IMPORT PROCESS START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...');
    const { jobId } = await req.json()
    console.log('Processing bulk import job:', jobId)

    console.log('Initializing Supabase client...');
    // Initialize Supabase client with service role key
    const supabaseServiceRole = createClient(
      'https://dkhrkignepqfidzdyper.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    console.log('Supabase client initialized');

    console.log('Fetching import job details...');
    // Fetch the import job details
    const { data: job, error: jobError } = await supabaseServiceRole
      .from('bulk_import_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle()

    if (jobError || !job) {
      console.error('Job not found:', jobError)
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update job status to processing
    await supabaseServiceRole
      .from('bulk_import_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId)

    // Download and parse CSV file
    const { data: csvData, error: downloadError } = await supabaseServiceRole.storage
      .from('bulk-imports')
      .download(job.file_path)

    if (downloadError || !csvData) {
      console.error('Failed to download CSV:', downloadError)
      await updateJobStatus(supabaseServiceRole, jobId, 'failed', 'Failed to download CSV file')
      return new Response(JSON.stringify({ error: 'Failed to download CSV file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const csvText = await csvData.text()
    const rows = parseCSV(csvText)
    
    if (rows.length === 0) {
      await updateJobStatus(supabaseServiceRole, jobId, 'failed', 'No data rows found in CSV')
      return new Response(JSON.stringify({ error: 'No data rows found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update total rows
    await supabaseServiceRole
      .from('bulk_import_jobs')
      .update({ total_rows: rows.length - 1 }) // Subtract header row
      .eq('id', jobId)

    // Process rows in batches
    const batchSize = 50
    let processedCount = 0
    let failedCount = 0
    const errors: any[] = []

    for (let i = 1; i < rows.length; i += batchSize) { // Skip header row
      const batch = rows.slice(i, Math.min(i + batchSize, rows.length))
      
      for (const row of batch) {
        try {
          await processRow(supabaseServiceRole, row, rows[0], job.template_selection, job.created_by, jobId)
          processedCount++
        } catch (error) {
          console.error('Failed to process row:', error)
          failedCount++
          errors.push({ row: i, error: error.message })
        }

        // Update progress
        await supabaseServiceRole
          .from('bulk_import_jobs')
          .update({ 
            processed_rows: processedCount,
            failed_rows: failedCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      }
    }

    // Final status update
    const finalStatus = failedCount > 0 ? 'completed_with_errors' : 'completed'
    await updateJobStatus(
      supabaseServiceRole, 
      jobId, 
      finalStatus, 
      errors.length > 0 ? { errors: errors.slice(0, 10) } : null // Limit error details
    )

    console.log(`Job ${jobId} completed: ${processedCount} processed, ${failedCount} failed`)

    return new Response(JSON.stringify({ 
      success: true, 
      processed: processedCount, 
      failed: failedCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('=== BULK IMPORT ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function updateJobStatus(supabase: any, jobId: string, status: string, errorDetails?: any) {
  await supabase
    .from('bulk_import_jobs')
    .update({ 
      status, 
      error_details: errorDetails,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
}

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim())
  return lines.map(line => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  })
}

async function processRow(
  supabase: any, 
  row: string[], 
  headers: string[], 
  templateSelection: any, 
  orgUserId: string,
  jobId: string
) {
  // Find email column
  const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'))
  if (emailIndex === -1 || !row[emailIndex]) {
    throw new Error('Email address required for each row')
  }

  const email = row[emailIndex].trim()
  const name = findNameFromRow(row, headers)

  // Create card invitation record
  const { data: invitation, error: inviteError } = await supabase
    .from('card_invitations')
    .insert({
      bulk_import_job_id: jobId,
      recipient_email: email,
      recipient_name: name,
      status: 'pending',
      invitation_data: {
        templates: templateSelection,
        row_data: Object.fromEntries(headers.map((h, i) => [h, row[i]]))
      }
    })
    .select()
    .single()

  if (inviteError) {
    throw new Error(`Failed to create invitation: ${inviteError.message}`)
  }

  console.log(`Created invitation for ${email}`)
}

function findNameFromRow(row: string[], headers: string[]): string {
  // Look for name-related columns
  const nameFields = ['name', 'full_name', 'first_name', 'last_name']
  
  for (const field of nameFields) {
    const index = headers.findIndex(h => h.toLowerCase().includes(field))
    if (index !== -1 && row[index]) {
      return row[index].trim()
    }
  }
  
  // Try combining first and last name
  const firstIndex = headers.findIndex(h => h.toLowerCase().includes('first'))
  const lastIndex = headers.findIndex(h => h.toLowerCase().includes('last'))
  
  if (firstIndex !== -1 && lastIndex !== -1) {
    const firstName = row[firstIndex]?.trim() || ''
    const lastName = row[lastIndex]?.trim() || ''
    return `${firstName} ${lastName}`.trim()
  }
  
  return ''
}