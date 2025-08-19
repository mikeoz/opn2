import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PassionData {
  id: string;
  topic: string;
  connections: number;
  activity: 'high' | 'medium' | 'low';
  category?: string;
  last_activity: string;
  engagement_score: number;
}

export const usePassionsData = () => {
  const [passions, setPassions] = useState<PassionData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchPassions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Query card_labels to find user's interests/passions
      const { data: labels, error } = await supabase
        .from('card_labels')
        .select(`
          id,
          label,
          created_at,
          user_card_id
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!labels || labels.length === 0) {
        setPassions([]);
        setLoading(false);
        return;
      }

      // Group labels by topic/passion and calculate metrics
      const passionMap = new Map<string, {
        ids: string[];
        connections: number;
        lastActivity: string;
        cardIds: string[];
      }>();

      labels.forEach(label => {
        // Extract hashtag-style topics from labels
        const topics = extractTopicsFromLabel(label.label);
        
        topics.forEach(topic => {
          if (!passionMap.has(topic)) {
            passionMap.set(topic, {
              ids: [],
              connections: 0,
              lastActivity: label.created_at,
              cardIds: []
            });
          }
          
          const existing = passionMap.get(topic)!;
          existing.ids.push(label.id);
          existing.connections++;
          existing.cardIds.push(label.user_card_id);
          
          if (new Date(label.created_at) > new Date(existing.lastActivity)) {
            existing.lastActivity = label.created_at;
          }
        });
      });

      // Transform to PassionData format
      const passionsData: PassionData[] = Array.from(passionMap.entries()).map(([topic, data]) => ({
        id: data.ids[0], // Use first ID as primary
        topic: topic.startsWith('#') ? topic : `#${topic}`,
        connections: data.connections,
        activity: calculateActivityLevel(data.connections, data.lastActivity),
        last_activity: formatTimeAgo(data.lastActivity),
        engagement_score: calculateEngagementScore(data.connections, data.lastActivity)
      }));

      // Sort by engagement score
      passionsData.sort((a, b) => b.engagement_score - a.engagement_score);

      setPassions(passionsData);
    } catch (error) {
      console.error('Error fetching passions data:', error);
      toast.error('Failed to load passions data');
      setPassions([]);
    } finally {
      setLoading(false);
    }
  };

  const extractTopicsFromLabel = (label: string): string[] => {
    // Extract hashtag-style topics and common interest words
    const hashtags = label.match(/#\w+/g) || [];
    const commonTopics = ['photography', 'hiking', 'cooking', 'reading', 'music', 'travel', 'fitness', 'art'];
    const foundTopics = commonTopics.filter(topic => 
      label.toLowerCase().includes(topic.toLowerCase())
    );
    
    return [...hashtags, ...foundTopics.map(t => `#${t}`)];
  };

  const calculateActivityLevel = (connections: number, lastActivity: string): PassionData['activity'] => {
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    
    if (connections >= 5 && daysSinceActivity < 7) return 'high';
    if (connections >= 3 || daysSinceActivity < 30) return 'medium';
    return 'low';
  };

  const calculateEngagementScore = (connections: number, lastActivity: string): number => {
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.max(0, 100 - daysSinceActivity);
    const connectionScore = connections * 10;
    
    return recencyScore + connectionScore;
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
    fetchPassions();
  }, [user]);

  return {
    passions,
    loading,
    refetch: fetchPassions,
    hasPassions: passions.length > 0
  };
};