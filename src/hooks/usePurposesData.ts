import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PurposeData {
  id: string;
  topic: string;
  connections: number;
  priority: 'high' | 'medium' | 'low';
  category?: string;
  progress_indicator?: number;
  last_updated: string;
  goal_type: 'career' | 'health' | 'financial' | 'personal' | 'social';
}

export const usePurposesData = () => {
  const [purposes, setPurposes] = useState<PurposeData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPurposes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Query user's cards to extract purpose/goal-related information
      const { data: userCards, error } = await supabase
        .from('user_cards')
        .select(`
          id,
          created_at,
          updated_at,
          template_id,
          card_field_values (
            id,
            template_field_id,
            value,
            template_fields (
              field_name,
              field_type
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!userCards || userCards.length === 0) {
        setPurposes([]);
        setLoading(false);
        return;
      }

      // Extract purpose-related information from card fields
      const purposeMap = new Map<string, {
        connections: number;
        lastUpdated: string;
        cardIds: string[];
        fieldValues: string[];
      }>();

      userCards.forEach(card => {
        card.card_field_values?.forEach(fieldValue => {
          if (fieldValue.template_fields?.field_name && fieldValue.value) {
            const purposes = extractPurposesFromField(
              fieldValue.template_fields.field_name,
              fieldValue.value
            );

            purposes.forEach(purpose => {
              if (!purposeMap.has(purpose)) {
                purposeMap.set(purpose, {
                  connections: 0,
                  lastUpdated: card.updated_at,
                  cardIds: [],
                  fieldValues: []
                });
              }

              const existing = purposeMap.get(purpose)!;
              existing.connections++;
              existing.cardIds.push(card.id);
              existing.fieldValues.push(fieldValue.value);
              
              if (new Date(card.updated_at) > new Date(existing.lastUpdated)) {
                existing.lastUpdated = card.updated_at;
              }
            });
          }
        });
      });

      // Transform to PurposeData format
      const purposesData: PurposeData[] = Array.from(purposeMap.entries()).map(([topic, data]) => ({
        id: data.cardIds[0], // Use first card ID as primary
        topic: topic.startsWith('#') ? topic : `#${topic}`,
        connections: data.connections,
        priority: calculatePriority(data.connections, data.lastUpdated),
        last_updated: formatTimeAgo(data.lastUpdated),
        goal_type: categorizeGoalType(topic),
        progress_indicator: calculateProgress(data.connections, data.fieldValues)
      }));

      // Sort by priority and recency
      purposesData.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      setPurposes(purposesData);
    } catch (error) {
      console.error('Error fetching purposes data:', error);
      toast.error('Failed to load purposes data');
      setPurposes([]);
    } finally {
      setLoading(false);
    }
  };

  const extractPurposesFromField = (fieldName: string, value: string): string[] => {
    const purposes: string[] = [];
    const lowerValue = value.toLowerCase();
    const lowerFieldName = fieldName.toLowerCase();

    // Common purpose/goal keywords
    const purposeKeywords = {
      career: ['career', 'job', 'professional', 'work', 'business', 'development'],
      health: ['health', 'fitness', 'wellness', 'medical', 'exercise', 'nutrition'],
      financial: ['financial', 'money', 'investment', 'savings', 'budget', 'planning'],
      personal: ['personal', 'growth', 'learning', 'education', 'skill'],
      social: ['social', 'community', 'volunteer', 'networking', 'relationship']
    };

    // Check field names for purpose indicators
    Object.entries(purposeKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerFieldName.includes(keyword) || lowerValue.includes(keyword)) {
          purposes.push(`${category}Development`);
        }
      });
    });

    // Extract hashtag-style goals
    const hashtags = value.match(/#\w+/g) || [];
    purposes.push(...hashtags);

    return [...new Set(purposes)]; // Remove duplicates
  };

  const calculatePriority = (connections: number, lastUpdated: string): PurposeData['priority'] => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
    
    if (connections >= 3 && daysSinceUpdate < 14) return 'high';
    if (connections >= 2 || daysSinceUpdate < 30) return 'medium';
    return 'low';
  };

  const categorizeGoalType = (topic: string): PurposeData['goal_type'] => {
    const lowerTopic = topic.toLowerCase();
    
    if (lowerTopic.includes('career') || lowerTopic.includes('professional')) return 'career';
    if (lowerTopic.includes('health') || lowerTopic.includes('wellness')) return 'health';
    if (lowerTopic.includes('financial') || lowerTopic.includes('money')) return 'financial';
    if (lowerTopic.includes('social') || lowerTopic.includes('community')) return 'social';
    return 'personal';
  };

  const calculateProgress = (connections: number, fieldValues: string[]): number => {
    // Simple progress calculation based on activity and completeness
    const completenessScore = fieldValues.filter(v => v.trim().length > 10).length * 20;
    const activityScore = Math.min(connections * 15, 40);
    
    return Math.min(completenessScore + activityScore, 100);
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  useEffect(() => {
    fetchPurposes();
  }, [user]);

  return {
    purposes,
    loading,
    refetch: fetchPurposes,
    hasPurposes: purposes.length > 0
  };
};