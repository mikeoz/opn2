import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toggleTemplateFavorite, getUserFavorites } from '@/utils/standardTemplateUtils';
import { toast } from 'sonner';

interface TemplateFavorite {
  template_id: string;
  template_type: 'standard' | 'user';
}

export const useTemplateFavorites = () => {
  const [favorites, setFavorites] = useState<TemplateFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getUserFavorites(user.id);
      setFavorites(data.map(item => ({
        ...item,
        template_type: item.template_type as 'standard' | 'user'
      })));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (
    templateId: string,
    templateType: 'standard' | 'user' = 'standard'
  ) => {
    if (!user) return false;
    
    try {
      const isFavorited = await toggleTemplateFavorite(templateId, user.id, templateType);
      await fetchFavorites();
      
      toast.success(
        isFavorited 
          ? 'Template added to favorites' 
          : 'Template removed from favorites'
      );
      
      return isFavorited;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
      return false;
    }
  };

  const isFavorited = (templateId: string, templateType: 'standard' | 'user' = 'standard') => {
    return favorites.some(f => 
      f.template_id === templateId && f.template_type === templateType
    );
  };

  const getFavoritesByType = (templateType: 'standard' | 'user') => {
    return favorites.filter(f => f.template_type === templateType);
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorited,
    getFavoritesByType,
    refetch: fetchFavorites
  };
};