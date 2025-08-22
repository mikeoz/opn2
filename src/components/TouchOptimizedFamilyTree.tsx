import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TreePine, 
  Users, 
  Crown, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { FamilyUnit } from '@/hooks/useFamilyUnits';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TouchOptimizedFamilyTreeProps {
  familyUnits: FamilyUnit[];
  selectedFamilyId?: string;
  onSelectFamily?: (familyId: string) => void;
  currentUserId?: string;
}

interface TouchNode {
  id: string;
  family: FamilyUnit;
  level: number;
  expanded: boolean;
  children: TouchNode[];
  parent?: TouchNode;
}

export const TouchOptimizedFamilyTree: React.FC<TouchOptimizedFamilyTreeProps> = ({
  familyUnits,
  selectedFamilyId,
  onSelectFamily,
  currentUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Build hierarchical tree structure
  const buildTree = (): TouchNode[] => {
    const nodeMap = new Map<string, TouchNode>();
    
    // Create all nodes
    familyUnits.forEach(family => {
      nodeMap.set(family.id, {
        id: family.id,
        family,
        level: family.generation_level,
        expanded: expandedNodes.has(family.id),
        children: [],
      });
    });

    // Build parent-child relationships
    const rootNodes: TouchNode[] = [];
    familyUnits.forEach(family => {
      const node = nodeMap.get(family.id)!;
      
      if (family.parent_family_unit_id) {
        const parent = nodeMap.get(family.parent_family_unit_id);
        if (parent) {
          parent.children.push(node);
          node.parent = parent;
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const filteredNodes = buildTree().filter(node => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      node.family.family_label.toLowerCase().includes(query) ||
      `${node.family.trust_anchor_profile?.first_name || ''} ${node.family.trust_anchor_profile?.last_name || ''}`.toLowerCase().includes(query)
    );
  });

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Touch/Pan handlers
  const handlePanStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsPanning(true);
    const point = 'touches' in e ? e.touches[0] : e;
    setLastPanPoint({ x: point.clientX, y: point.clientY });
  };

  const handlePanMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    
    const point = 'touches' in e ? e.touches[0] : e;
    const deltaX = point.clientX - lastPanPoint.x;
    const deltaY = point.clientY - lastPanPoint.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPoint({ x: point.clientX, y: point.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel * 1.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel * 0.8, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const renderNode = (node: TouchNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedFamilyId === node.id;
    const isMyFamily = node.family.trust_anchor_user_id === currentUserId;

    return (
      <div key={node.id} className="space-y-2">
        {/* Node card */}
        <div
          className={`
            relative p-4 rounded-lg border-2 transition-all touch-manipulation
            ${isSelected ? 'border-benefit bg-benefit/5' : 'border-border bg-card'}
            ${isMyFamily ? 'bg-benefit/5 border-benefit/30' : ''}
            active:scale-95 hover:shadow-md min-h-touch-target
          `}
          style={{ marginLeft: `${depth * (isMobile ? 16 : 24)}px` }}
          onClick={() => onSelectFamily?.(node.id)}
        >
          {/* Family info */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm truncate">
                  {node.family.family_label}
                </h4>
                {isMyFamily && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
                <Badge variant="outline" className="text-xs">
                  G{node.family.generation_level}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground truncate">
                {node.family.trust_anchor_profile?.first_name} {node.family.trust_anchor_profile?.last_name}
              </p>
              
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {node.family.member_count || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Expand/collapse button */}
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.id);
                }}
                className="h-8 w-8 p-0 touch-manipulation"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-2 border-l-2 border-muted ml-4">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* Controls */}
      <Card>
        <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Family Tree
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    <strong>Touch Optimized:</strong> Tap to select, pinch to zoom, 
                    drag to pan. In Demo Mode, family data is simulated. 
                    Alpha Testing will sync with real family connections.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search families..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-touch-friendly"
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomOut}
                className="h-8 w-8 p-0 touch-manipulation"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2 min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleZoomIn}
                className="h-8 w-8 p-0 touch-manipulation"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                className="h-8 w-8 p-0 touch-manipulation ml-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {filteredNodes.length} families
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tree container */}
      <Card className={`${isFullscreen ? 'flex-1 flex flex-col' : 'min-h-96'}`}>
        <CardContent className={`p-0 ${isFullscreen ? 'flex-1' : ''}`}>
          <div
            ref={containerRef}
            className={`
              w-full overflow-hidden bg-background relative touch-pan-y
              ${isFullscreen ? 'h-full' : 'h-96'}
            `}
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: '0 0'
            }}
            onTouchStart={handlePanStart}
            onTouchMove={handlePanMove}
            onTouchEnd={handlePanEnd}
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
          >
            <div className="p-4 space-y-3">
              {filteredNodes.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center text-muted-foreground">
                    <TreePine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No families found</p>
                  </div>
                </div>
              ) : (
                filteredNodes.map(node => renderNode(node))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};