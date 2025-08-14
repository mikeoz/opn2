import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MobileLayout from '@/components/MobileLayout';
import { exportMarkdownToWord } from '@/utils/documentExport';

const userGuideMarkdown = `# Opnli Community Directory - User Guide

## Overview

The Opnli Community Directory is a comprehensive platform that enables both individual and organizational users to create, manage, and share digital cards for networking and community building. The system supports two main account types with distinct capabilities and features.

## Account Types

### Individual Account
Personal accounts for individual users who want to create and manage their own cards and connect with others in the community.

### Non-Individual (Organization) Account
Organizational accounts for businesses, institutions, or groups that need to manage multiple members and cards under a unified organizational structure.

---

## Getting Started

### Registration and Login
1. **Register**: Create an account by choosing either "Individual" or "Non-Individual (Organization)" account type
2. **Login**: Access your account using your credentials
3. **Profile Setup**: Complete your profile information including avatar, contact details, and organization information (if applicable)

### Dashboard
The main dashboard provides:
- Overview of recent activity
- Quick access to "People," "Places," "Passions," and "Purposes"
- Administrator tools (if you have admin privileges)
- Navigation to key features

---

## Core Features

### Profile Management
**Available to: All users**

- **View Profile**: Access your complete profile information
- **Edit Profile**: Update personal/organizational details, contact information
- **Avatar Upload**: Upload and manage profile pictures
- **Password Management**: Change account passwords securely
- **Account Information**: View account type and security settings

### Card Management
**Available to: All users**

#### My Cards
- **Create Cards**: Design and create digital cards with custom information
- **Edit Cards**: Modify existing card content and design
- **View Cards**: Preview how your cards appear to others
- **Card Relationships**: Establish connections between different cards

#### Card Features
- Template-based creation
- Custom information fields
- Visual design options
- Sharing capabilities
- Relationship mapping

### Directory
**Available to: All users**

- **Browse Community**: Explore cards created by other users
- **Search Functionality**: Find specific users, organizations, or topics
- **Filter Options**: Narrow results by categories, locations, or interests
- **View Public Cards**: Access publicly shared community cards

---

## Individual User Capabilities

### Personal Card Creation
- Create personal business cards
- Share contact information
- Showcase skills and interests
- Connect with other community members

### Networking Features
- Browse community directory
- View other users' cards
- Establish professional connections
- Participate in community activities

### Profile Management
- Maintain personal profile
- Upload personal avatar
- Update contact information
- Manage privacy settings

---

## Organizational User Capabilities

### Organization Management
**Available to: Organization account holders**

#### Member Management
- **Invite Members**: Add team members to your organization
- **Assign Roles**: Set admin or member permissions
- **Manage Memberships**: Oversee member status and access levels
- **Remove Members**: Remove users from organizational access

#### Administrative Features
- **Organization Profile**: Manage organizational information and branding
- **Multi-User Access**: Enable multiple team members to create cards under the organization
- **Centralized Control**: Oversee all organizational cards and activities

### Enhanced Card Capabilities
- Create cards representing the organization
- Enable team members to create cards under organizational umbrella
- Manage organizational branding across all cards
- Coordinate team networking activities

### Bulk Operations
- **Bulk Import**: Import multiple cards or user data simultaneously
- **Template Management**: Create and manage card templates for consistency
- **Mass Updates**: Apply changes across multiple organizational cards

---

## Administrative Features

### Admin Access
**Available to: Users with admin privileges**

Admin privileges are granted to:
- Organization account creators (automatic)
- Manually assigned administrators
- Users with elevated permissions

#### Admin Cards Management (\`/admin/cards\`)
- **Template Creation**: Design card templates for organization-wide use
- **Template Library**: Access and manage standard template collections
- **Card Oversight**: Monitor and manage cards across the platform
- **Quality Control**: Ensure cards meet organizational standards

#### Bulk Import Manager (\`/admin/bulk-import\`)
- **Data Import**: Upload CSV files or structured data for mass card creation
- **Import Validation**: Verify data integrity before processing
- **Batch Processing**: Handle large-scale data imports efficiently
- **Import History**: Track and review previous import operations

### Security and Audit
- **Security Dashboard**: Monitor system security and access patterns
- **Audit Logs**: Review user activities and system changes
- **Access Control**: Manage user permissions and organizational access
- **Data Protection**: Ensure compliance with privacy and security standards

---

## Navigation and Access

### Main Navigation
- **Dashboard**: Central hub for all activities
- **My Cards**: Personal card management
- **Directory**: Community browsing
- **Profile**: Account and profile management

### Admin Navigation
- **Settings Icon**: Access Admin Cards Management
- **Upload Icon**: Access Bulk Import Manager
- **Admin Tools**: Quick access from dashboard (for admin users)

### Mobile Experience
- **Responsive Design**: Full functionality on mobile devices
- **Mobile Layout**: Optimized interface for smaller screens
- **Touch-Friendly**: Intuitive mobile interactions

---

## User Workflows

### For Individual Users
1. **Getting Started**: Register → Complete Profile → Create First Card
2. **Networking**: Browse Directory → Connect with Others → Share Cards
3. **Maintenance**: Update Profile → Refresh Cards → Engage Community

### For Organizational Users
1. **Setup**: Register Organization → Complete Profile → Set Up Team Access
2. **Team Onboarding**: Invite Members → Assign Roles → Create Templates
3. **Operations**: Bulk Import → Manage Cards → Monitor Activity
4. **Growth**: Scale Team → Expand Templates → Enhance Networking

### For Administrators
1. **Platform Management**: Monitor Security → Review Audit Logs → Manage Access
2. **Content Oversight**: Manage Templates → Review Cards → Ensure Quality
3. **Data Operations**: Process Imports → Validate Data → Maintain Standards

---

## Best Practices

### Security
- Use strong passwords and update them regularly
- Be mindful of information shared in public cards
- Review and update privacy settings periodically
- Report any suspicious activity to administrators

### Organization Management
- Establish clear roles and permissions for team members
- Use templates to maintain consistency across organizational cards
- Regularly review member access and remove inactive users
- Coordinate with team members on card creation and updates

### Community Engagement
- Keep profile and card information current and accurate
- Respect community guidelines and other users' privacy
- Participate constructively in community networking
- Use the directory responsibly for legitimate networking purposes

---

## Support and Troubleshooting

### Common Issues
- **Access Denied**: Verify your account type and permissions
- **Missing Features**: Check if you need admin privileges for certain functions
- **Template Issues**: Ensure you have proper permissions for template creation
- **Import Problems**: Verify data format and file structure for bulk imports

### Getting Help
- Review this user guide for feature explanations
- Check the Admin User Guide for administrative functions
- Contact system administrators for access or permission issues
- Report technical problems through appropriate channels

---

## Conclusion

The Opnli Community Directory provides a flexible platform that scales from individual networking needs to comprehensive organizational card management. Whether you're an individual looking to connect with your community or an organization managing team networking activities, the system offers the tools and features necessary for effective digital relationship building.

For additional technical information and administrative details, refer to the Admin User Guide and other system documentation.`;

export default function UserGuide() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportToWord = async () => {
    setIsExporting(true);
    try {
      const success = await exportMarkdownToWord(
        userGuideMarkdown,
        'Opnli_Community_Directory_User_Guide.docx',
        'Opnli Community Directory - User Guide'
      );
      
      if (success) {
        toast({
          title: "Success",
          description: "User guide exported successfully as Word document"
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export user guide to Word document",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        return;
      }
      
      // Handle headings
      if (trimmedLine.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-3xl font-bold mt-8 mb-4 text-foreground">
            {trimmedLine.replace('# ', '')}
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-2xl font-semibold mt-6 mb-3 text-foreground">
            {trimmedLine.replace('## ', '')}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-foreground">
            {trimmedLine.replace('### ', '')}
          </h3>
        );
      } else if (trimmedLine.startsWith('#### ')) {
        elements.push(
          <h4 key={index} className="text-lg font-medium mt-3 mb-2 text-foreground">
            {trimmedLine.replace('#### ', '')}
          </h4>
        );
      }
      // Handle horizontal rules
      else if (trimmedLine === '---') {
        elements.push(<hr key={index} className="my-6 border-border" />);
      }
      // Handle list items
      else if (trimmedLine.startsWith('- ')) {
        const content = trimmedLine.replace('- ', '');
        // Check if content contains bold markdown
        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(content)) {
          const parts = content.split(boldRegex);
          elements.push(
            <li key={index} className="ml-6 mb-1 text-muted-foreground">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <strong key={partIndex} className="text-foreground">{part}</strong>
                ) : (
                  part
                )
              )}
            </li>
          );
        } else {
          elements.push(
            <li key={index} className="ml-6 mb-1 text-muted-foreground">
              • {content}
            </li>
          );
        }
      }
      // Handle numbered lists
      else if (/^\d+\.\s/.test(trimmedLine)) {
        const content = trimmedLine.replace(/^\d+\.\s/, '');
        // Check if content contains bold markdown
        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(content)) {
          const parts = content.split(boldRegex);
          elements.push(
            <li key={index} className="ml-6 mb-1 text-muted-foreground list-decimal">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <strong key={partIndex} className="text-foreground">{part}</strong>
                ) : (
                  part
                )
              )}
            </li>
          );
        } else {
          elements.push(
            <li key={index} className="ml-6 mb-1 text-muted-foreground list-decimal">
              {content}
            </li>
          );
        }
      }
      // Handle bold text and code blocks in paragraphs
      else if (trimmedLine.length > 0) {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const codeRegex = /`([^`]+)`/g;
        
        let processedContent = trimmedLine;
        
        if (boldRegex.test(processedContent) || codeRegex.test(processedContent)) {
          // Split by both bold and code patterns
          const parts = processedContent.split(/(\*\*.*?\*\*|`[^`]+`)/);
          elements.push(
            <p key={index} className="mb-3 text-muted-foreground leading-relaxed">
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex} className="text-foreground">{part.slice(2, -2)}</strong>;
                } else if (part.startsWith('`') && part.endsWith('`')) {
                  return <code key={partIndex} className="bg-muted px-1 py-0.5 rounded text-sm">{part.slice(1, -1)}</code>;
                } else {
                  return part;
                }
              })}
            </p>
          );
        } else {
          elements.push(
            <p key={index} className="mb-3 text-muted-foreground leading-relaxed">
              {trimmedLine}
            </p>
          );
        }
      }
    });
    
    return elements;
  };

  return (
    <MobileLayout>
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">User Guide</h1>
          <p className="text-muted-foreground">Complete guide to using the Opnli Community Directory</p>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>User Guide</CardTitle>
            </div>
            <Button
              onClick={handleExportToWord}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exporting..." : "Download as Word"}</span>
            </Button>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-4">
              {renderMarkdownContent(userGuideMarkdown)}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}