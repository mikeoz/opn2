import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TreePine, 
  Users, 
  Crown, 
  Search, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Share2,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  MapPin
} from 'lucide-react';
import { FamilyUnit } from '@/hooks/useFamilyUnits';

interface InteractiveFamilyTreeProps {
  familyUnits: FamilyUnit[];
  selectedFamilyId?: string;
  onSelectFamily?: (familyId: string) => void;
  currentUserId?: string;
}

interface TreeNode {
  id: string;
  family: FamilyUnit;
  children: TreeNode[];
  parent?: TreeNode;
  level: number;
  position: { x: number; y: number };
  visible: boolean;
  expanded: boolean;
}

const LAYOUT_MODES = [
  { id: 'vertical', name: 'Vertical Tree', icon: '↕️' },
  { id: 'horizontal', name: 'Horizontal Tree', icon: '↔️' },
  { id: 'radial', name: 'Radial Tree', icon: '🌸' },
  { id: 'compact', name: 'Compact View', icon: '📦' }
];

const FILTER_OPTIONS = [
  { id: 'all', name: 'All Families', count: 0 },
  { id: 'generation-1', name: 'Generation 1', count: 0 },
  { id: 'generation-2', name: 'Generation 2', count: 0 },
  { id: 'generation-3', name: 'Generation 3+', count: 0 },
  { id: 'my-families', name: 'My Families', count: 0 },
  { id: 'recent', name: 'Recently Active', count: 0 }
];

export const InteractiveFamilyTree: React.FC<InteractiveFamilyTreeProps> = ({
  familyUnits,
  selectedFamilyId,
  onSelectFamily,
  currentUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [layoutMode, setLayoutMode] = useState('vertical');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [hiddenFamilies, setHiddenFamilies] = useState<Set<string>>(new Set());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Build tree structure from family units
  const buildTreeNodes = (): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create nodes for all families
    familyUnits.forEach(family => {
      const node: TreeNode = {
        id: family.id,
        family,
        children: [],
        level: family.generation_level,
        position: { x: 0, y: 0 },
        visible: !hiddenFamilies.has(family.id),
        expanded: expandedFamilies.has(family.id)
      };
      nodeMap.set(family.id, node);
    });

    // Build parent-child relationships
    familyUnits.forEach(family => {
      const node = nodeMap.get(family.id);
      if (!node) return;

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

  // Calculate positions based on layout mode
  const calculatePositions = (nodes: TreeNode[]): void => {
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 120;
    const HORIZONTAL_SPACING = 250;
    const VERTICAL_SPACING = 150;

    const calculateVerticalLayout = (node: TreeNode, x: number, y: number, depth: number = 0): number => {
      node.position = { x, y };
      
      if (node.children.length === 0) {
        return x + NODE_WIDTH;
      }

      let currentX = x;
      node.children.forEach((child, index) => {
        const childY = y + VERTICAL_SPACING;
        currentX = calculateVerticalLayout(child, currentX, childY, depth + 1);
        if (index < node.children.length - 1) {
          currentX += HORIZONTAL_SPACING;
        }
      });

      // Center parent over children
      if (node.children.length > 0) {
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        node.position.x = (firstChild.position.x + lastChild.position.x) / 2;
      }

      return currentX;
    };

    let startX = 100;
    nodes.forEach((rootNode, index) => {
      startX = calculateVerticalLayout(rootNode, startX, 50);
      if (index < nodes.length - 1) {
        startX += HORIZONTAL_SPACING * 2;
      }
    });
  };

  const treeNodes = buildTreeNodes();
  calculatePositions(treeNodes);

  // Filter nodes based on search and filters
  const getFilteredNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.filter(node => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const familyLabel = node.family.family_label.toLowerCase();
        const trustAnchorName = `${node.family.trust_anchor_profile?.first_name || ''} ${node.family.trust_anchor_profile?.last_name || ''}`.toLowerCase();
        
        if (!familyLabel.includes(query) && !trustAnchorName.includes(query)) {
          return false;
        }
      }

      // Generation filter
      if (selectedFilter.startsWith('generation-')) {
        const generation = parseInt(selectedFilter.split('-')[1]);
        if (generation === 3) {
          return node.family.generation_level >= 3;
        }
        return node.family.generation_level === generation;
      }

      // My families filter
      if (selectedFilter === 'my-families' && currentUserId) {
        return node.family.trust_anchor_user_id === currentUserId;
      }

      return node.visible;
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel * 0.8, 0.3));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setDragOffset({ x: 0, y: 0 });
  };

  const toggleFamilyVisibility = (familyId: string) => {
    const newHidden = new Set(hiddenFamilies);
    if (newHidden.has(familyId)) {
      newHidden.delete(familyId);
    } else {
      newHidden.add(familyId);
    }
    setHiddenFamilies(newHidden);
  };

  const toggleFamilyExpanded = (familyId: string) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
    }
    setExpandedFamilies(newExpanded);
  };

  const FamilyNode: React.FC<{ node: TreeNode; isSelected: boolean }> = ({ node, isSelected }) => {
    const family = node.family;
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedFamilies.has(family.id);
    const isHidden = hiddenFamilies.has(family.id);
    const isMyFamily = family.trust_anchor_user_id === currentUserId;

    return (
      <g
        transform={`translate(${node.position.x}, ${node.position.y})`}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelectFamily?.(family.id);
        }}
      >
        {/* Family unit card */}
        <rect
          width="180"
          height="100"
          rx="8"
          className={`
            fill-background stroke-2 transition-all
            ${isSelected ? 'stroke-primary' : 'stroke-border'}
            ${isMyFamily ? 'fill-primary/5' : ''}
            hover:stroke-primary/70
          `}
        />
        
        {/* Family name */}
        <text
          x="90"
          y="25"
          textAnchor="middle"
          className="text-sm font-medium fill-foreground"
        >
          {family.family_label.length > 20 
            ? family.family_label.substring(0, 20) + '...' 
            : family.family_label
          }
        </text>
        
        {/* Trust anchor */}
        <text
          x="90"
          y="40"
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
        >
          {family.trust_anchor_profile?.first_name} {family.trust_anchor_profile?.last_name}
        </text>

        {/* Generation badge */}
        <rect
          x="8"
          y="8"
          width="30"
          height="16"
          rx="8"
          className="fill-primary/10 stroke-primary/30"
        />
        <text
          x="23"
          y="18"
          textAnchor="middle"
          className="text-xs fill-primary font-medium"
        >
          G{family.generation_level}
        </text>

        {/* Member count */}
        <g transform="translate(8, 75)">
          <circle r="8" className="fill-muted stroke-muted-foreground" />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            className="text-xs fill-muted-foreground"
          >
            {family.member_count || 0}
          </text>
        </g>

        {/* Trust anchor crown */}
        {isMyFamily && (
          <g transform="translate(150, 10)">
            <circle r="10" className="fill-yellow-100 stroke-yellow-500" />
            <text x="0" y="2" textAnchor="middle" className="text-xs">👑</text>
          </g>
        )}

        {/* Expand/collapse button for families with children */}
        {hasChildren && (
          <g
            transform="translate(160, 85)"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              toggleFamilyExpanded(family.id);
            }}
          >
            <circle r="8" className="fill-background stroke-border hover:stroke-primary" />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              className="text-xs fill-foreground"
            >
              {isExpanded ? '−' : '+'}
            </text>
          </g>
        )}

        {/* Connection lines to children */}
        {hasChildren && isExpanded && node.children.map(child => (
          <line
            key={child.id}
            x1="90"
            y1="100"
            x2={child.position.x - node.position.x + 90}
            y2={child.position.y - node.position.y}
            className="stroke-border stroke-2"
          />
        ))}
      </g>
    );
  };

  const filteredNodes = getFilteredNodes(treeNodes);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Interactive Family Tree
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search families..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                <SelectItem value="generation-1">Generation 1</SelectItem>
                <SelectItem value="generation-2">Generation 2</SelectItem>
                <SelectItem value="generation-3">Generation 3+</SelectItem>
                <SelectItem value="my-families">My Families</SelectItem>
              </SelectContent>
            </Select>

            <Select value={layoutMode} onValueChange={setLayoutMode}>
              <SelectTrigger className="w-[140px]">
                <Settings className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUT_MODES.map(mode => (
                  <SelectItem key={mode.id} value={mode.id}>
                    {mode.icon} {mode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPermissions(!showPermissions)}
            >
              {showPermissions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Permissions
            </Button>
          </div>

          {/* Layout info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Families: {filteredNodes.length}</span>
              <span>Generations: {Math.max(...familyUnits.map(f => f.generation_level))}</span>
              <span>Total Members: {familyUnits.reduce((sum, f) => sum + (f.member_count || 0), 0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Crown className="h-3 w-3 mr-1" />
                You control {familyUnits.filter(f => f.trust_anchor_user_id === currentUserId).length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tree visualization */}
      <Card className="min-h-[400px]">
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="w-full h-[600px] overflow-hidden border rounded-md bg-background relative"
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`${-dragOffset.x} ${-dragOffset.y} ${containerRef.current?.clientWidth || 800} ${containerRef.current?.clientHeight || 600}`}
              className="absolute inset-0"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
                </pattern>
              </defs>
              
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Render tree nodes */}
              {filteredNodes.map(node => (
                <FamilyNode
                  key={node.id}
                  node={node}
                  isSelected={selectedFamilyId === node.id}
                />
              ))}
            </svg>

            {/* Empty state */}
            {filteredNodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No families match your filters</p>
                  <p className="text-sm">Try adjusting your search or filter criteria</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary bg-primary/5 rounded"></div>
              <span>Selected Family</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-border bg-background rounded"></div>
              <span>Other Families</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Your Families</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary/10 border border-primary/30 rounded-full"></div>
              <span>Generation Level</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted border border-muted-foreground rounded-full"></div>
              <span>Member Count</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};