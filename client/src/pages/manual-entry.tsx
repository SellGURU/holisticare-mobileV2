import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Save, Search } from "lucide-react";
import { Link } from "wouter";

const commonBiomarkers = [
  { name: "Cholesterol Total", units: ["mg/dL", "mmol/L"], category: "Cardiovascular" },
  { name: "LDL Cholesterol", units: ["mg/dL", "mmol/L"], category: "Cardiovascular" },
  { name: "HDL Cholesterol", units: ["mg/dL", "mmol/L"], category: "Cardiovascular" },
  { name: "Triglycerides", units: ["mg/dL", "mmol/L"], category: "Cardiovascular" },
  { name: "Glucose", units: ["mg/dL", "mmol/L"], category: "Metabolic" },
  { name: "HbA1c", units: ["%", "mmol/mol"], category: "Metabolic" },
  { name: "Vitamin D", units: ["ng/mL", "nmol/L"], category: "Vitamin" },
  { name: "Vitamin B12", units: ["pg/mL", "pmol/L"], category: "Vitamin" },
  { name: "Hemoglobin", units: ["g/dL", "g/L"], category: "Blood Count" },
  { name: "White Blood Count", units: ["cells/μL", "×10³/μL"], category: "Blood Count" },
  { name: "Creatinine", units: ["mg/dL", "μmol/L"], category: "Kidney Function" },
  { name: "ALT", units: ["U/L", "IU/L"], category: "Liver Function" },
  { name: "AST", units: ["U/L", "IU/L"], category: "Liver Function" },
  { name: "TSH", units: ["mIU/L", "μIU/mL"], category: "Thyroid" },
  { name: "Free T4", units: ["ng/dL", "pmol/L"], category: "Thyroid" },
];

const commonUnits = ["mg/dL", "mmol/L", "ng/mL", "pg/mL", "%", "g/dL", "U/L", "IU/L", "mIU/L", "cells/μL"];

export default function ManualEntry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    testName: "",
    value: "",
    unit: "",
    testDate: new Date().toISOString().split('T')[0],
    referenceMin: "",
    referenceMax: "",
    notes: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBiomarkers, setFilteredBiomarkers] = useState<typeof commonBiomarkers>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const entryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        testName: data.testName.trim(),
        value: parseFloat(data.value),
        unit: data.unit,
        testDate: new Date(data.testDate).toISOString(),
        referenceMin: data.referenceMin ? parseFloat(data.referenceMin) : undefined,
        referenceMax: data.referenceMax ? parseFloat(data.referenceMax) : undefined,
        notes: data.notes.trim() || undefined,
        source: "manual",
      };

      const response = await apiRequest('POST', '/api/lab-results', payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lab result saved",
        description: "Your test result has been successfully recorded.",
      });
      
      // Reset form
      setFormData({
        testName: "",
        value: "",
        unit: "",
        testDate: new Date().toISOString().split('T')[0],
        referenceMin: "",
        referenceMax: "",
        notes: "",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/lab-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-score"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save result",
        description: error instanceof Error ? error.message : "Please check your data and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setFormData(prev => ({ ...prev, testName: value }));
    
    if (value.trim()) {
      const filtered = commonBiomarkers.filter(marker =>
        marker.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredBiomarkers(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectBiomarker = (biomarker: typeof commonBiomarkers[0]) => {
    setFormData(prev => ({
      ...prev,
      testName: biomarker.name,
      unit: biomarker.units[0], // Set first unit as default
    }));
    setSearchQuery(biomarker.name);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.testName.trim()) {
      toast({
        title: "Test name required",
        description: "Please enter the name of the test.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.value || isNaN(parseFloat(formData.value))) {
      toast({
        title: "Valid test value required",
        description: "Please enter a valid numeric test value.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.unit) {
      toast({
        title: "Unit required",
        description: "Please select the unit for this test.",
        variant: "destructive",
      });
      return;
    }

    if (formData.referenceMin && formData.referenceMax) {
      const min = parseFloat(formData.referenceMin);
      const max = parseFloat(formData.referenceMax);
      if (min >= max) {
        toast({
          title: "Invalid reference range",
          description: "Minimum reference value must be less than maximum.",
          variant: "destructive",
        });
        return;
      }
    }

    entryMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center">
          <Link href="/you">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manual Data Entry</h2>
        </div>
      </div>

      <div className="p-4">
        <Card className="ui-rise">
          <CardHeader>
            <CardTitle>Add Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Test Name with Search */}
              <div className="relative">
                <Label htmlFor="testName">Test Name</Label>
                <div className="relative">
                  <Input
                    id="testName"
                    type="text"
                    placeholder="Search for test (e.g., Cholesterol, Vitamin D)"
                    value={formData.testName}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pr-10"
                    required
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                {/* Suggestions dropdown */}
                {showSuggestions && filteredBiomarkers.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto">
                    <CardContent className="p-0">
                      {filteredBiomarkers.map((biomarker, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          onClick={() => selectBiomarker(biomarker)}
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">{biomarker.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{biomarker.category}</div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Value and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="value">Test Value</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="185"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show units from selected biomarker first */}
                      {formData.testName && 
                        commonBiomarkers
                          .find(b => b.name === formData.testName)
                          ?.units.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))
                      }
                      {/* Show all common units */}
                      {commonUnits.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Test Date */}
              <div>
                <Label htmlFor="testDate">Test Date</Label>
                <Input
                  id="testDate"
                  type="date"
                  value={formData.testDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, testDate: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Reference Range */}
              <div>
                <Label>Reference Range (Optional)</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={formData.referenceMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenceMin: e.target.value }))}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={formData.referenceMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, referenceMax: e.target.value }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Add any additional notes about this test..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={entryMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {entryMutation.isPending ? "Saving..." : "Save Test Result"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 text-base">Entry Tips</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Start typing to search for common biomarkers</li>
              <li>• Include reference ranges when available for better insights</li>
              <li>• Use the same test names for consistent tracking</li>
              <li>• Notes can include lab name, fasting status, etc.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
