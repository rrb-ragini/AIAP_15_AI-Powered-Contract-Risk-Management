import { useState } from 'react';
import { Search, Copy, Check, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { mockGoldenClauses } from '../data/mockData';

export function GoldenClauseLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(mockGoldenClauses.map(c => c.category)))];

  const filteredClauses = mockGoldenClauses.filter(clause => {
    const matchesSearch = 
      clause.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || clause.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Golden Clause Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Industry-standard contract clauses recommended by legal experts
        </p>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search clauses by type, content, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-64">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.filter(c => c !== 'all').map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Badge variant="secondary" className="text-xs">
                  {filteredClauses.length} clauses found
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Clause Cards */}
          <div className="grid grid-cols-1 gap-6">
            {filteredClauses.map((clause) => (
              <Card key={clause.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{clause.type}</CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {clause.category}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(clause.text, clause.id)}
                    >
                      {copiedId === clause.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Clause
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Clause Text */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-700">Golden Clause Text</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-800 leading-relaxed">
                      {clause.text}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-gray-700">Why This Is Preferred</h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
                      {clause.explanation}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClauses.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No clauses found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search query or filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
