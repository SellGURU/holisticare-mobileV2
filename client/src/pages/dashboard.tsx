import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { formatRelativeDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import HealthScoreCard from "@/components/health/health-score-card";
import BiomarkerCard from "@/components/health/biomarker-card";
import IntelligenceSection from "@/components/intelligence/IntelligenceSection";
import { Upload, Edit, TrendingUp, CheckSquare, Brain, Plus, Activity, Calendar, Target, Trophy, Heart, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Modal states
  const [showLabUploadModal, setShowLabUploadModal] = useState(false);
  const [showHolisticPlanModal, setShowHolisticPlanModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  
  // Form states
  const [uploadType, setUploadType] = useState<'file' | 'manual'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualEntry, setManualEntry] = useState({
    biomarker: '',
    value: '',
    unit: '',
    testDate: ''
  });
  
  const [holisticPlanForm, setHolisticPlanForm] = useState({
    concerns: '',
    goals: '',
    preferences: '',
    validationType: 'ai'
  });
  
  const [symptomForm, setSymptomForm] = useState({
    type: '',
    severity: [5],
    date: '',
    notes: ''
  });
  
  const [goalForm, setGoalForm] = useState({
    type: '',
    title: '',
    target: '',
    unit: '',
    targetDate: ''
  });
  
  const [selectedChallenge, setSelectedChallenge] = useState('');

  const { data: healthScore } = useQuery({
    queryKey: ["/api/health-score"],
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ["/api/lab-results", { limit: 5 }],
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["/api/insights"],
  });

  const { data: actionPlans = [] } = useQuery({
    queryKey: ["/api/action-plans", { status: "active" }],
  });

  // Mutations
  const uploadLabMutation = useMutation({
    mutationFn: async (data: any) => {
      if (uploadType === 'file') {
        const formData = new FormData();
        formData.append('file', selectedFile!);
        return fetch('/api/upload', { method: 'POST', body: formData });
      } else {
        return apiRequest('POST', '/api/lab-results/manual', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results'] });
      setShowLabUploadModal(false);
      toast({ title: "Lab result uploaded successfully", description: "Your new lab data has been added to your profile." });
    }
  });

  const createHolisticPlanMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/api/holistic-plans/generate', data),
    onSuccess: () => {
      setShowHolisticPlanModal(false);
      toast({ title: "Holistic plan created", description: "Your personalized health plan has been generated." });
    }
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => apiRequest('POST', `/api/wellness-challenges/${challengeId}/join`, {}),
    onSuccess: () => {
      setShowChallengeModal(false);
      toast({ title: "Challenge joined!", description: "You've successfully joined the wellness challenge." });
    }
  });

  const logSymptomMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/api/symptoms', data),
    onSuccess: () => {
      setShowSymptomModal(false);
      toast({ title: "Symptom logged", description: "Your symptom has been recorded successfully." });
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/api/health-goals', data),
    onSuccess: () => {
      setShowGoalModal(false);
      toast({ title: "Goal created", description: "Your new health goal has been set." });
    }
  });

  const challenges = [
    { id: '1', title: '30-Day Cardio Challenge', description: 'Improve cardiovascular health with daily activities', duration: '30 days' },
    { id: '2', title: 'Nutrition Reset', description: 'Focus on whole foods and balanced nutrition', duration: '21 days' },
    { id: '3', title: 'Mindfulness Journey', description: 'Daily meditation and stress management', duration: '14 days' },
    { id: '4', title: 'Sleep Optimization', description: 'Improve sleep quality and consistency', duration: '28 days' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Clean Header - No duplicate notifications */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Welcome back, {user?.fullName?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Let's check your health progress today</p>
          </div>
          <Link href="/you">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <IntelligenceSection />

        {/* Health Score Card - Redesigned */}
        <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Health Score</h3>
                </div>
                <div className="text-4xl font-bold mb-1">{healthScore?.overallScore || 85}</div>
                <p className="text-blue-100 text-sm mb-3">Overall health index</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/20 p-0 h-auto"
                  asChild
                >
                  <Link href="/trends">View detailed trends →</Link>
                </Button>
              </div>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                  <Activity className="w-8 h-8" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-white/90 to-blue-50/60 dark:from-gray-800/90 dark:to-blue-900/20 border shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {labResults?.length || 5}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">Lab Tests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white/90 to-green-50/60 dark:from-gray-800/90 dark:to-green-900/20 border shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {actionPlans?.filter(plan => plan.status === 'active').length || 2}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">Active Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white/90 to-purple-50/60 dark:from-gray-800/90 dark:to-purple-900/20 border shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {insights?.length || 0}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">AI Insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white/90 to-red-50/60 dark:from-gray-800/90 dark:to-red-900/20 border shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {healthScore?.overallScore || 78}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Health Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Dialog open={showLabUploadModal} onOpenChange={setShowLabUploadModal}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Upload Lab Results</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">File or manual entry</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Lab Results</DialogTitle>
                  <DialogDescription>Choose how you'd like to add your lab results</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      variant={uploadType === 'file' ? 'default' : 'outline'} 
                      onClick={() => setUploadType('file')}
                      className="flex-1"
                    >
                      File Upload
                    </Button>
                    <Button 
                      variant={uploadType === 'manual' ? 'default' : 'outline'} 
                      onClick={() => setUploadType('manual')}
                      className="flex-1"
                    >
                      Manual Entry
                    </Button>
                  </div>
                  
                  {uploadType === 'file' ? (
                    <div className="space-y-3">
                      <Label>Select Lab Report</Label>
                      <Input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <Button 
                        onClick={() => uploadLabMutation.mutate({})}
                        disabled={!selectedFile || uploadLabMutation.isPending}
                        className="w-full"
                      >
                        {uploadLabMutation.isPending ? 'Uploading...' : 'Upload File'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label>Biomarker</Label>
                        <Select value={manualEntry.biomarker} onValueChange={(value) => setManualEntry(prev => ({ ...prev, biomarker: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select biomarker" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cholesterol">Total Cholesterol</SelectItem>
                            <SelectItem value="ldl">LDL Cholesterol</SelectItem>
                            <SelectItem value="hdl">HDL Cholesterol</SelectItem>
                            <SelectItem value="glucose">Glucose</SelectItem>
                            <SelectItem value="hemoglobin">Hemoglobin A1C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Value</Label>
                          <Input 
                            value={manualEntry.value}
                            onChange={(e) => setManualEntry(prev => ({ ...prev, value: e.target.value }))}
                            placeholder="Enter value"
                          />
                        </div>
                        <div>
                          <Label>Unit</Label>
                          <Input 
                            value={manualEntry.unit}
                            onChange={(e) => setManualEntry(prev => ({ ...prev, unit: e.target.value }))}
                            placeholder="mg/dL"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Test Date</Label>
                        <Input 
                          type="date"
                          value={manualEntry.testDate}
                          onChange={(e) => setManualEntry(prev => ({ ...prev, testDate: e.target.value }))}
                        />
                      </div>
                      <Button 
                        onClick={() => uploadLabMutation.mutate(manualEntry)}
                        disabled={!manualEntry.biomarker || !manualEntry.value || uploadLabMutation.isPending}
                        className="w-full"
                      >
                        {uploadLabMutation.isPending ? 'Adding...' : 'Add Result'}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showHolisticPlanModal} onOpenChange={setShowHolisticPlanModal}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                      <Brain className="w-6 h-6 text-secondary" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Create Holistic Plan</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">AI or doctor validated</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Holistic Health Plan</DialogTitle>
                  <DialogDescription>Get a personalized comprehensive health plan</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Health Concerns</Label>
                    <Textarea 
                      value={holisticPlanForm.concerns}
                      onChange={(e) => setHolisticPlanForm(prev => ({ ...prev, concerns: e.target.value }))}
                      placeholder="Describe your current health concerns..."
                    />
                  </div>
                  <div>
                    <Label>Goals</Label>
                    <Textarea 
                      value={holisticPlanForm.goals}
                      onChange={(e) => setHolisticPlanForm(prev => ({ ...prev, goals: e.target.value }))}
                      placeholder="What do you want to achieve?"
                    />
                  </div>
                  <div>
                    <Label>Validation Type</Label>
                    <Select value={holisticPlanForm.validationType} onValueChange={(value) => setHolisticPlanForm(prev => ({ ...prev, validationType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai">AI Generated (Free)</SelectItem>
                        <SelectItem value="doctor">Doctor Validated ($15)</SelectItem>
                        <SelectItem value="clinic">Clinic Partnership ($25)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => createHolisticPlanMutation.mutate(holisticPlanForm)}
                    disabled={!holisticPlanForm.concerns || !holisticPlanForm.goals || createHolisticPlanMutation.isPending}
                    className="w-full"
                  >
                    {createHolisticPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showChallengeModal} onOpenChange={setShowChallengeModal}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                      <Trophy className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Start Challenge</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Wellness challenges</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Choose a Wellness Challenge</DialogTitle>
                  <DialogDescription>Select a challenge to improve your health</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {challenges.map((challenge) => (
                    <div 
                      key={challenge.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedChallenge === challenge.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedChallenge(challenge.id)}
                    >
                      <h4 className="font-medium">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      <span className="text-xs text-blue-600">{challenge.duration}</span>
                    </div>
                  ))}
                  <Button 
                    onClick={() => joinChallengeMutation.mutate(selectedChallenge)}
                    disabled={!selectedChallenge || joinChallengeMutation.isPending}
                    className="w-full"
                  >
                    {joinChallengeMutation.isPending ? 'Joining...' : 'Join Challenge'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showSymptomModal} onOpenChange={setShowSymptomModal}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-md transition-all border-2 hover:border-primary">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3 mx-auto">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Log Symptom</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Track symptoms</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Symptom</DialogTitle>
                  <DialogDescription>Track your symptoms and their severity</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Symptom Type</Label>
                    <Select value={symptomForm.type} onValueChange={(value) => setSymptomForm(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select symptom" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="headache">Headache</SelectItem>
                        <SelectItem value="fatigue">Fatigue</SelectItem>
                        <SelectItem value="nausea">Nausea</SelectItem>
                        <SelectItem value="dizziness">Dizziness</SelectItem>
                        <SelectItem value="pain">Pain</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Severity (1-10): {symptomForm.severity[0]}</Label>
                    <Slider
                      value={symptomForm.severity}
                      onValueChange={(value) => setSymptomForm(prev => ({ ...prev, severity: value }))}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={symptomForm.date}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea 
                      value={symptomForm.notes}
                      onChange={(e) => setSymptomForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional details..."
                    />
                  </div>
                  <Button 
                    onClick={() => logSymptomMutation.mutate(symptomForm)}
                    disabled={!symptomForm.type || !symptomForm.date || logSymptomMutation.isPending}
                    className="w-full"
                  >
                    {logSymptomMutation.isPending ? 'Logging...' : 'Log Symptom'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Recent Biomarkers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Biomarkers</h3>
            <Link href="/trends">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {labResults.length > 0 ? (
              labResults.slice(0, 3).map((result: any) => (
                <BiomarkerCard
                  key={result.id}
                  name={result.testName}
                  value={parseFloat(result.value)}
                  unit={result.unit}
                  referenceMin={result.referenceMin ? parseFloat(result.referenceMin) : undefined}
                  referenceMax={result.referenceMax ? parseFloat(result.referenceMax) : undefined}
                  testDate={result.testDate}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-gray-400 mb-2">📊</div>
                  <p className="text-gray-600 dark:text-gray-400">No lab results yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Upload your first lab results to get started
                  </p>
                  <Link href="/lab-upload">
                    <Button className="mt-3" size="sm">
                      Upload Results
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">AI Insights</h3>
            <div className="space-y-3">
              {insights.slice(0, 2).map((insight: any) => (
                <Card key={insight.id} className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{insight.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {insight.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{insight.content}</p>
                        <Button variant="ghost" size="sm" className="text-primary">
                          View Recommendations →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Action Plans Preview */}
        {actionPlans.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Plans</h3>
              <Link href="/action-plans">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {actionPlans.slice(0, 2).map((plan: any) => (
                <Card key={plan.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{plan.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {plan.type === 'ai_generated' ? 'AI Generated' : 'Doctor Validated'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{plan.description}</p>
                    
                    {plan.tasks && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {plan.tasks.filter((t: any) => t.completed).length}/{plan.tasks.length} tasks
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all duration-500" 
                            style={{ 
                              width: `${(plan.tasks.filter((t: any) => t.completed).length / plan.tasks.length) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Created {formatRelativeDate(plan.createdAt)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
