import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatRelativeDate, generateId } from "@/lib/utils";
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Circle, 
  Clock,
  Brain,
  Users,
  Edit,
  Share,
  Trash2
} from "lucide-react";
import { Link } from "wouter";
import type { ActionPlan } from "@shared/schema";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export default function ActionPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    tasks: [] as Task[],
  });
  const [newTask, setNewTask] = useState("");

  const { data: activePlans = [] } = useQuery<ActionPlan[]>({
    queryKey: ["/api/action-plans", { status: "active" }],
  });

  const { data: completedPlans = [] } = useQuery<ActionPlan[]>({
    queryKey: ["/api/action-plans", { status: "completed" }],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: typeof newPlan) => {
      const response = await apiRequest('POST', '/api/action-plans', {
        title: planData.title,
        description: planData.description,
        type: 'manual',
        status: 'active',
        tasks: planData.tasks,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Action plan created",
        description: "Your new action plan has been created successfully.",
      });
      setShowCreateDialog(false);
      setNewPlan({ title: "", description: "", tasks: [] });
      queryClient.invalidateQueries({ queryKey: ["/api/action-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updates }: { planId: number; updates: Partial<ActionPlan> }) => {
      const response = await apiRequest('PUT', `/api/action-plans/${planId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/action-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update plan",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: generateId(),
        text: newTask.trim(),
        completed: false,
      };
      setNewPlan(prev => ({
        ...prev,
        tasks: [...prev.tasks, task],
      }));
      setNewTask("");
    }
  };

  const removeTask = (taskId: string) => {
    setNewPlan(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId),
    }));
  };

  const toggleTask = (plan: ActionPlan, taskId: string) => {
    const updatedTasks = plan.tasks.map((task: Task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    // Check if all tasks are completed
    const allCompleted = updatedTasks.every(task => task.completed);
    const updates: Partial<ActionPlan> = {
      tasks: updatedTasks,
      status: allCompleted ? 'completed' : 'active',
    };

    updatePlanMutation.mutate({ planId: plan.id, updates });

    if (allCompleted) {
      toast({
        title: "Congratulations!",
        description: "You've completed all tasks in this action plan.",
      });
    }
  };

  const handleCreatePlan = () => {
    if (!newPlan.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your action plan.",
        variant: "destructive",
      });
      return;
    }

    if (newPlan.tasks.length === 0) {
      toast({
        title: "Tasks required",
        description: "Please add at least one task to your action plan.",
        variant: "destructive",
      });
      return;
    }

    createPlanMutation.mutate(newPlan);
  };

  const calculateProgress = (tasks: Task[]) => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  const getPlanTypeIcon = (type: string) => {
    switch (type) {
      case 'ai_generated':
        return <Brain className="w-4 h-4" />;
      case 'doctor_validated':
        return <Users className="w-4 h-4" />;
      default:
        return <Edit className="w-4 h-4" />;
    }
  };

  const getPlanTypeBadge = (type: string) => {
    switch (type) {
      case 'ai_generated':
        return <Badge className="bg-primary/10 text-primary border-primary/20">AI Generated</Badge>;
      case 'doctor_validated':
        return <Badge className="bg-secondary/10 text-secondary border-secondary/20">Doctor Validated</Badge>;
      default:
        return <Badge variant="outline">Manual</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/you">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Action Plans</h2>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Action Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan-title">Plan Title</Label>
                  <Input
                    id="plan-title"
                    placeholder="e.g., Improve Vitamin D Levels"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="plan-description">Description</Label>
                  <Textarea
                    id="plan-description"
                    placeholder="Describe your health goal..."
                    value={newPlan.description}
                    onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Tasks</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a task..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    />
                    <Button onClick={addTask} size="sm">Add</Button>
                  </div>
                  
                  {newPlan.tasks.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {newPlan.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm">{task.text}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTask(task.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreatePlan} 
                    disabled={createPlanMutation.isPending}
                    className="flex-1"
                  >
                    {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Active Plans */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Active Plans ({activePlans.length})
          </h3>
          
          {activePlans.length > 0 ? (
            <div className="space-y-4">
              {activePlans.map((plan) => {
                const progress = calculateProgress(plan.tasks as Task[]);
                
                return (
                  <Card key={plan.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getPlanTypeIcon(plan.type)}
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {plan.title}
                            </h4>
                            {getPlanTypeBadge(plan.type)}
                          </div>
                          {plan.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {plan.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {(plan.tasks as Task[]).filter(t => t.completed).length}/{(plan.tasks as Task[]).length} tasks completed
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2 transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Tasks */}
                      <div className="space-y-2 mb-4">
                        {(plan.tasks as Task[]).map((task) => (
                          <div key={task.id} className="flex items-center space-x-3">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(plan, task.id)}
                            />
                            <span 
                              className={`text-sm flex-1 ${
                                task.completed 
                                  ? 'text-gray-500 dark:text-gray-500 line-through' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          Created {formatRelativeDate(plan.createdAt)}
                        </span>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-gray-400 mb-2">📋</div>
                <p className="text-gray-600 dark:text-gray-400">No active action plans</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 mb-4">
                  Create your first action plan to start tracking health goals
                </p>
                <Button onClick={() => setShowCreateDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Create Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Plans */}
        {completedPlans.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Completed Plans ({completedPlans.length})
            </h3>
            
            <div className="space-y-4">
              {completedPlans.map((plan) => (
                <Card key={plan.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {plan.title}
                          </h4>
                          <Badge className="bg-green-50 text-green-700 border-green-200">
                            Completed
                          </Badge>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="w-full bg-green-100 dark:bg-green-900/20 rounded-full h-2">
                        <div className="bg-green-500 rounded-full h-2 w-full" />
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Completed all {(plan.tasks as Task[]).length} tasks • Goal achieved {formatRelativeDate(plan.updatedAt)}
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
