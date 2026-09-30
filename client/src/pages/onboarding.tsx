import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  User, 
  Target, 
  Scale, 
  Ruler, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  QrCode,
  UserPlus,
  LogIn,
  Brain,
  Shield,
  Calendar,
  Star
} from "lucide-react";
import { Link, useLocation } from "wouter";
// import logoImage from "@assets/Logo5 2_1753791920091_1757240780580.png";

const ONBOARDING_STEPS = 26;

interface OnboardingData {
  // Personal Info
  name: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  mainGoal: string;
  
  // Health Questionnaire
  diet: string;
  mealsPerDay: string;
  foodIntolerances: string[];
  workoutFrequency: string;
  activityLevel: string;
  sleepDuration: string;
  sleepQuality: string[];
  smoking: string;
  focusIssues: string;
  snacksPerDay: string;
  emotionalEating: string;
  menstrualCycle: string;
  nervousness: string;
  caffeine: string;
  forgetfulness: string;
  medicalConditions: string[];
  familyHistory: string[];
  allergies: string[];
  medications: string[];
  recentSymptoms: string[];
  alcoholConsumption: string;
  
  // Account
  subscriptionPlan: string;
  accountMethod: string;
}

const questions = [
  {
    id: 'diet',
    question: 'What has your diet been like over the past 3 months?',
    options: [
      'Standard (A blend of healthy and unhealthy foods)',
      'Mediterranean',
      'Vegetarian (No meat)',
      'Vegan (No animal-based products)',
      'Mostly processed and sugary foods (No restrictions)',
      'Keto / LCHF (Low-carb, high-fat foods)',
      'Paleo (Foods found during the Palaeolithic era)',
      'Carnivore (All meat-based products)',
      'Pescatarian (No meat except for fish)',
      'Diet for athletes in bulking phase (High protein diet)',
      'Autoimmune Protocols (Meat, seafood, non-starchy vegetables, mushrooms, fruits)',
      'Other'
    ]
  },
  {
    id: 'mealsPerDay',
    question: 'Number of main meals a day (Except for snacks)',
    options: ['1-2', '3-4', '5-6', 'More than 6']
  },
  {
    id: 'foodIntolerances',
    question: 'Do you have any food intolerances? We\'ll ask about allergens later',
    options: ['Gluten', 'Lactose', 'Animal protein', 'Other', 'I have no intolerances'],
    multiple: true
  },
  {
    id: 'workoutFrequency',
    question: 'How often do you workout? Workouts raise your heartbeat to at least 120-150 bpm',
    options: ['Never', '1–2 hours per week', '3–5 hours per week', '6+ hours per week']
  },
  {
    id: 'activityLevel',
    question: 'Select your activity level (Not including time spent working out)',
    options: [
      'Sedentary (Working at a desk, not walking much)',
      'Lightly active (1.5-3K steps per day)',
      'Moderately active (3-10K steps per day)',
      'Strenuous work (More than 10k steps per day)'
    ]
  },
  {
    id: 'sleepDuration',
    question: 'Duration of sleep - How many hours of sleep do you get on average each night?',
    options: ['Less than 6 hours', '6–7 hours', '7-8.5 hours', '8.5-10 hours', 'more than 10 hours']
  },
  {
    id: 'sleepQuality',
    question: 'Quality of sleep - have you had any problems sleeping over the past few months?',
    options: [
      'I have trouble sleeping for a long time',
      'I sleep lightly and don\'t feel well',
      'I often wake up at night',
      'I find it hard to wake up in the morning',
      'I stay awake at night and sleep during the day',
      'I\'m having headaches while sleeping',
      'I wake up during the night because I\'m hungry',
      'I wake up early and can\'t fall back asleep',
      'I want to sleep every time after I eat',
      'I don\'t get enough sleep',
      'I sleep well'
    ],
    multiple: true
  },
  {
    id: 'smoking',
    question: 'Do you smoke?',
    options: [
      'No',
      'I used to smoke but no longer do',
      'Passive smoker',
      'Somebody is constantly smoking nearby',
      'Occasionally',
      'A couple of cigarettes a week',
      'A few cigarettes per day',
      '1 pack of cigarettes per day',
      'More than 1 pack of cigarettes per day'
    ]
  },
  {
    id: 'focusIssues',
    question: 'Are you experiencing loss of focus and lack of attention? How often do you get distracted while reading a book, attending a meeting, or doing other activities?',
    options: ['Never', 'Seldomly', 'Quite often', 'Very often', 'Always']
  },
  {
    id: 'snacksPerDay',
    question: 'Number of snacks a day (Including your morning coffee with cream)',
    options: ['0-1', '2-3', '4-6', 'more than 6']
  },
  {
    id: 'emotionalEating',
    question: 'Emotional eating - In a typical week, how often do you turn to food when stressed, unhappy, angry, or bored?',
    options: ['Never', 'Seldomly', 'Quite often', 'Very often', 'Every time']
  },
  {
    id: 'menstrualCycle',
    question: 'How regular is your menstrual cycle?',
    options: ['Regular cycle', 'Irregular cycle', 'Paused due to breastfeeding', 'I\'m pregnant', 'N/A']
  },
  {
    id: 'nervousness',
    question: 'Nervousness & panic - In the last month, how often have you felt very nervous or anxious?',
    options: ['Never', 'Seldomly', 'Quite often', 'Very often', 'Always']
  },
  {
    id: 'caffeine',
    question: 'How many caffeinated beverages do you have on average per day? Examples include coffee, strong teas, and energy drinks',
    options: ['None', 'Less than 1 cup or can per day', '1-2 cups or cans per day', '3-4 cups or cans per day', 'More than 4 cups or cans per day']
  },
  {
    id: 'forgetfulness',
    question: 'Forgetfulness - How often do you forget where you put things like your keys, wallet, and glasses?',
    options: ['Never', 'Seldomly', 'Quite often', 'Very often', 'Always']
  },
  {
    id: 'medicalConditions',
    question: 'Have you ever been diagnosed with any of the following conditions?',
    options: [
      'Type 2 diabetes or prediabetes',
      'High cholesterol',
      'Anaemia',
      'Autoimmune disorder',
      'Major mental illness',
      'Cancer',
      'Digestive disorder (Crohn\'s disease, etc.)',
      'Type 1 diabetes',
      'Neurodegenerative diseases (Alzheimer\'s, Parkinson\'s, etc.)',
      'Arthritis',
      'Eating disorder',
      'Cardiovascular diseases / High blood Pressure',
      'None of the above'
    ],
    multiple: true
  },
  {
    id: 'familyHistory',
    question: 'Have any of your family members ever been diagnosed with the following conditions?',
    options: [
      'Type 2 diabetes or prediabetes',
      'Type 1 diabetes',
      'Stroke',
      'Autoimmune disorder',
      'Major mental illness',
      'Cancer',
      'Digestive disorder (Crohn\'s disease, etc.)',
      'High cholesterol',
      'Neurodegenerative diseases (Alzheimer\'s, Parkinson\'s, etc.)',
      'Arthritis',
      'Cardiovascular diseases / High blood pressure',
      'None of the above'
    ],
    multiple: true
  },
  {
    id: 'allergies',
    question: 'Do you have any allergies?',
    options: [
      'Food (Milk, peanuts, shellfish, etc.)',
      'Medications',
      'Dust mites',
      'Animal fur',
      'Mould and yeast',
      'Household chemicals',
      'Tree or plant pollen',
      'Insect bites',
      'Other',
      'I Have no allergies'
    ],
    multiple: true
  },
  {
    id: 'medications',
    question: 'Which drugs or supplements do you take consistently?',
    options: [
      'Vitamins and supplements',
      'Hormones, including oral contraceptives',
      'Antibiotics',
      'Blood pressure normalizers',
      'Sugar-lowering therapy',
      'Chemotherapy',
      'Antidepressants',
      'Other',
      'I don\'t take anything'
    ],
    multiple: true
  },
  {
    id: 'recentSymptoms',
    question: 'Have you suffered from any of the following conditions in the past 3 months?',
    options: [
      'Chronic fatigue',
      'Insomnia',
      'Increased excitability',
      'Drowsiness',
      'Excessive sweating',
      'Anxiety',
      'Recurrent thrush / herpes',
      'Severe dryness of the skin',
      'Decreased libido',
      'Frequent constipation',
      'Fussiness, sleep disorders',
      'A tendency for loose stools',
      'Swelling of the face, fingers, or legs',
      'Chronic headaches',
      'Worsening memory',
      'Persistent cough',
      'Trembling fingers or twitching muscles',
      'Excess weight gain that does not decrease even with physical activity and dieting',
      'Weakness',
      'Chilliness',
      'Increased heart rate',
      'Attention span issues',
      'Regular cramps in the calf muscles after physical activity',
      'Laziness or the desire to put things off for later',
      'Cravings for sweets',
      'Shedding hair or peeling nails',
      'Early gray hair',
      'A decrease in weight regardless of how much you eat',
      'Depression',
      'None of the above'
    ],
    multiple: true
  },
  {
    id: 'alcoholConsumption',
    question: 'Do you drink alcohol?',
    options: [
      'No',
      'I used to drink but no longer do',
      'Occasionally (A couple of drinks a week)',
      'A few drinks per week',
      'Daily consumption',
      'Heavy drinking (Multiple drinks daily)'
    ]
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    mainGoal: '',
    diet: '',
    mealsPerDay: '',
    foodIntolerances: [],
    workoutFrequency: '',
    activityLevel: '',
    sleepDuration: '',
    sleepQuality: [],
    smoking: '',
    focusIssues: '',
    snacksPerDay: '',
    emotionalEating: '',
    menstrualCycle: '',
    nervousness: '',
    caffeine: '',
    forgetfulness: '',
    medicalConditions: [],
    familyHistory: [],
    allergies: [],
    medications: [],
    recentSymptoms: [],
    alcoholConsumption: '',
    subscriptionPlan: '',
    accountMethod: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const progress = (step / ONBOARDING_STEPS) * 100;

  const nextStep = () => {
    if (step < ONBOARDING_STEPS) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleMultipleChoice = (questionId: string, option: string) => {
    setData(prev => {
      const currentValues = Array.isArray(prev[questionId as keyof OnboardingData]) 
        ? prev[questionId as keyof OnboardingData] as string[]
        : [];
      
      if (currentValues.includes(option)) {
        return {
          ...prev,
          [questionId]: currentValues.filter(val => val !== option)
        };
      } else {
        return {
          ...prev,
          [questionId]: [...currentValues, option]
        };
      }
    });
  };

  const completeOnboarding = () => {
    // Save onboarding data and redirect to dashboard
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('onboardingData', JSON.stringify(data));
    toast({
      title: "Welcome to HolistiCare!",
      description: "Your profile has been created successfully.",
    });
    setLocation('/');
  };

  // Step 23 - Analysis simulation
  useEffect(() => {
    if (step === 23) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        nextStep();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center">
              {/* <img 
                src={logoImage} 
                alt="HolistiCare Logo" 
                className="w-24 h-24 rounded-full object-cover shadow-xl"
              /> */}
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                HolistiCare is your personal health coach
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Monitor your entire body and prevent problems before they happen
              </p>
            </div>
            <Button onClick={nextStep} size="lg" className="w-full max-w-sm">
              Get Started
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Let's get started
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Do you have an existing account or are you a new user?
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full p-6 h-auto justify-start"
                onClick={nextStep}
              >
                <UserPlus className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">I'm a new user</div>
                  <div className="text-sm text-gray-500">Create a new account</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full p-6 h-auto justify-start"
                onClick={() => {
                  localStorage.setItem('onboardingCompleted', 'true');
                  setLocation('/auth');
                }}
              >
                <LogIn className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">I have an account</div>
                  <div className="text-sm text-gray-500">Sign in to existing account</div>
                </div>
              </Button>

              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">Or scan QR code to connect device</p>
                <Button variant="ghost" className="p-4">
                  <QrCode className="w-8 h-8" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome!</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Specify your name, age and sex
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name/Nickname</Label>
                <Input
                  id="name"
                  placeholder="Enter your name or nickname"
                  value={data.name}
                  onChange={(e) => setData({...data, name: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={data.age}
                  onChange={(e) => setData({...data, age: e.target.value})}
                />
              </div>

              <div>
                <Label>Sex</Label>
                <Select value={data.gender} onValueChange={(value) => setData({...data, gender: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.gender && (
                <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Checkbox id="profile-confirm" />
                  <Label htmlFor="profile-confirm" className="text-sm">
                    This is my profile
                  </Label>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  onClick={nextStep} 
                  className="w-full"
                  disabled={!data.name || !data.age || !data.gender}
                >
                  Accept
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  By continuing, you agree to our <Link href="/terms" className="underline">Terms of Use</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Choose your main goal
              </h2>
            </div>

            <div className="space-y-3">
              {[
                'I want to improve my health',
                'Store my labs and exams in one place',
                'Track my health post-COVID',
                'Track my pregnancy',
                'Track the balance of vitamins and minerals'
              ].map((goal, index) => (
                <Button
                  key={index}
                  variant={data.mainGoal === goal ? "default" : "outline"}
                  className="w-full p-4 h-auto text-left justify-start"
                  onClick={() => setData({...data, mainGoal: goal})}
                >
                  <Target className="w-5 h-5 mr-3" />
                  {goal}
                </Button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <Scale className="w-16 h-16 mx-auto text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                What's your weight?
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Enter your weight"
                  value={data.weight}
                  onChange={(e) => setData({...data, weight: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <Ruler className="w-16 h-16 mx-auto text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                What's your height?
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Enter your height"
                  value={data.height}
                  onChange={(e) => setData({...data, height: e.target.value})}
                />
              </div>
            </div>
          </div>
        );

      case 23:
        return (
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <Brain className="w-16 h-16 mx-auto text-blue-600 animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Analysing your profile...
              </h2>
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Everything in one place</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Store lab reports and medical documents from different clinics in one easy app
                </p>
              </div>
            </div>
            <Progress value={isAnalyzing ? 100 : 0} className="w-full" />
          </div>
        );

      case 24:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Your digital profile to track your health is ready
              </h2>
            </div>

            <div className="space-y-4">
              {[
                'Personalized checkup created',
                'Health risks calculated',
                'Storage for lab results is set up',
                'Access to helpful content and expert advice'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <Button onClick={nextStep} className="w-full">
              Continue
            </Button>
          </div>
        );

      case 25:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Try HolistiCare Plus
              </h2>
            </div>

            <div className="space-y-4">
              <Card className="relative">
                <Badge className="absolute -top-2 left-4 bg-orange-500">POPULAR</Badge>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">12 Months</h3>
                      <p className="text-sm text-gray-500">$2.30/week</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">$79.99</div>
                      <div className="text-sm text-green-600">Save 33%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">1 Month</h3>
                      <p className="text-sm text-gray-500">Flexible, no commitment</p>
                    </div>
                    <div className="font-bold">$9.99</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">Forever (Lifetime)</h3>
                      <p className="text-sm text-gray-500">$1.53/week - Lifetime access to all features</p>
                    </div>
                    <div className="font-bold">$275.14</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <Button onClick={nextStep} className="w-full">
                Continue
              </Button>
              <Button variant="outline" className="w-full">
                Not sure yet? Enable free trial
              </Button>
              <Button variant="ghost" className="w-full text-sm">
                Restore Purchases
              </Button>
            </div>
          </div>
        );

      case 26:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <Shield className="w-16 h-16 mx-auto text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Save your settings and data
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Prevent data loss when switching devices and enable sharing with family members
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full p-4 h-auto"
                onClick={completeOnboarding}
              >
                Continue with Google
              </Button>
              <Button 
                variant="outline" 
                className="w-full p-4 h-auto"
                onClick={completeOnboarding}
              >
                Continue with Apple
              </Button>
              <Button 
                variant="outline" 
                className="w-full p-4 h-auto"
                onClick={completeOnboarding}
              >
                Continue with email
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Note: If sharing with family, avoid hiding Apple email
            </p>
          </div>
        );

      default:
        // Questionnaire steps (7-22)
        if (step >= 7 && step <= 22) {
          const questionIndex = step - 7;
          const question = questions[questionIndex];
          
          if (!question) return null;

          return (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {question.question}
                </h2>
              </div>

              <div className="space-y-3">
                {question.multiple ? (
                  // Multiple choice checkboxes
                  question.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`${question.id}-${index}`}
                        checked={(data[question.id as keyof OnboardingData] as string[])?.includes(option)}
                        onCheckedChange={() => handleMultipleChoice(question.id, option)}
                      />
                      <Label htmlFor={`${question.id}-${index}`} className="text-sm leading-relaxed">
                        {option}
                      </Label>
                    </div>
                  ))
                ) : (
                  // Single choice radio buttons
                  <RadioGroup
                    value={data[question.id as keyof OnboardingData] as string}
                    onValueChange={(value) => setData({...data, [question.id]: value})}
                  >
                    {question.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                        <Label htmlFor={`${question.id}-${index}`} className="text-sm leading-relaxed">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Progress Bar */}
      {step > 1 && step < 23 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
          <div 
            className="h-1 bg-blue-600 transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {step > 1 && step !== 23 && (
          <Button variant="ghost" size="sm" onClick={prevStep}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1" />
        {step > 2 && step < 23 && (
          <div className="text-sm text-gray-500">
            {step - 2} of {ONBOARDING_STEPS - 4}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div key={step} className="w-full max-w-md space-y-6 ui-page-in">
          {renderStep()}
          
          {/* Navigation */}
          {step >= 4 && step <= 22 && step !== 23 && (
            <div className="flex gap-3 pt-6">
              <Button 
                onClick={nextStep} 
                className="flex-1"
                disabled={
                  (step === 4 && !data.mainGoal) ||
                  (step === 5 && !data.weight) ||
                  (step === 6 && !data.height) ||
                  (step >= 7 && step <= 22 && !data[questions[step - 7]?.id as keyof OnboardingData])
                }
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}