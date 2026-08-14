import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardCard, StandardCardHeader, StandardCardContent, StandardCardTitle } from "@/components/ui/standard-card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Settings, Download, Upload, Edit, Trash2, Eye, Star } from "lucide-react";

export default function ComponentShowcase() {
  const [selectedValue, setSelectedValue] = useState("");

  return (
    <div className="p-8 space-y-12 bg-gradient-to-br from-slate-50 to-white min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
          Enhanced UI Components
        </h1>
        <p className="text-slate-600 text-lg">Modern, gradient-enhanced components with glass morphism effects</p>
      </div>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Primary Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Small Default
              </Button>
              <Button variant="default" size="default">
                <Settings className="h-4 w-4 mr-2" />
                Default
              </Button>
              <Button variant="default" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Large
              </Button>
              <Button variant="default" size="xl">
                <Upload className="h-4 w-4 mr-2" />
                Extra Large
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Color Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="success">
                <Star className="h-4 w-4 mr-2" />
                Success
              </Button>
              <Button variant="warning">Warning</Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Destructive
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="glass">Glass</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Style Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Outline
              </Button>
              <Button variant="ghost">
                <Eye className="h-4 w-4 mr-2" />
                Ghost
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="link">Link Button</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Components */}
      <Card>
        <CardHeader>
          <CardTitle>Input Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Text Inputs</h3>
              <Input placeholder="Standard input with glass effect" />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search with icon..." className="pl-10" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Select Dropdowns</h3>
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                  <SelectItem value="option4">Option 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Status Badges</h3>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="glass">Glass</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Standard Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">This is a standard card with glass morphism effects and enhanced shadows.</p>
          </CardContent>
        </Card>

        <StandardCard variant="metric" colorScheme="blue">
          <StandardCardHeader>
            <StandardCardTitle className="text-blue-900">Metric Card</StandardCardTitle>
          </StandardCardHeader>
          <StandardCardContent>
            <p className="text-blue-700">This card uses the standardized metric variant with blue color scheme.</p>
          </StandardCardContent>
        </StandardCard>

        <StandardCard variant="interactive">
          <StandardCardHeader>
            <StandardCardTitle className="text-slate-900">Interactive Card</StandardCardTitle>
          </StandardCardHeader>
          <StandardCardContent>
            <p className="text-slate-700">This card uses the interactive variant with hover effects.</p>
          </StandardCardContent>
        </StandardCard>
      </div>

      {/* Standardized Card Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Standardized Card System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StandardCard variant="default">
              <StandardCardHeader>
                <StandardCardTitle>Default Card</StandardCardTitle>
              </StandardCardHeader>
              <StandardCardContent>
                <p className="text-slate-600">Standard card with consistent styling.</p>
              </StandardCardContent>
            </StandardCard>

            <StandardCard variant="header">
              <StandardCardHeader variant="gradient">
                <StandardCardTitle>Header Card</StandardCardTitle>
              </StandardCardHeader>
              <StandardCardContent>
                <p className="text-slate-600">Card with gradient header background.</p>
              </StandardCardContent>
            </StandardCard>

            <StandardCard variant="interactive">
              <StandardCardHeader>
                <StandardCardTitle>Interactive Card</StandardCardTitle>
              </StandardCardHeader>
              <StandardCardContent>
                <p className="text-slate-600">Card with hover effects and backdrop blur.</p>
              </StandardCardContent>
            </StandardCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StandardCard variant="metric" colorScheme="blue">
              <StandardCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-medium">Blue Metric</p>
                    <p className="text-2xl font-bold text-blue-900">$12,345</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600">📊</span>
                  </div>
                </div>
              </StandardCardContent>
            </StandardCard>

            <StandardCard variant="metric" colorScheme="green">
              <StandardCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-medium">Green Metric</p>
                    <p className="text-2xl font-bold text-green-900">+15.3%</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600">📈</span>
                  </div>
                </div>
              </StandardCardContent>
            </StandardCard>

            <StandardCard variant="metric" colorScheme="orange">
              <StandardCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-700 text-sm font-medium">Orange Metric</p>
                    <p className="text-2xl font-bold text-orange-900">1,234</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600">⚠️</span>
                  </div>
                </div>
              </StandardCardContent>
            </StandardCard>

            <StandardCard variant="metric" colorScheme="red">
              <StandardCardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 text-sm font-medium">Red Metric</p>
                    <p className="text-2xl font-bold text-red-900">-5.2%</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600">📉</span>
                  </div>
                </div>
              </StandardCardContent>
            </StandardCard>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Example */}
      <Card>
        <CardHeader>
          <CardTitle>Dialog Component</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enhanced Dialog</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-slate-600">
                  This dialog features glass morphism effects with backdrop blur and enhanced styling.
                </p>
                <div className="space-y-3">
                  <Input placeholder="Enter your name..." />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline">Cancel</Button>
                  <Button variant="default">Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Interactive Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Form Example</h3>
              <div className="space-y-3">
                <Input placeholder="Email address" type="email" />
                <Input placeholder="Password" type="password" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="default" className="w-full">
                  Create Account
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Action Buttons</h3>
              <div className="space-y-3">
                <Button variant="success" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="warning" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
                <Button variant="glass" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}