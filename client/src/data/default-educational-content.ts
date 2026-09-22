export type EducationalItem = {
  content: string;
  ["reference link"]: string;
  title: string;
};

export const DEFAULT_EDUCATIONAL_CONTENT: EducationalItem[] = [
  {
    title: "Understanding Your Cholesterol Numbers",
    "reference link": "",
    content: `# Understanding Your Cholesterol Numbers

Cholesterol is a waxy substance found in your blood that your body needs to build healthy cells. However, high levels of cholesterol can increase your risk of heart disease.

## Types of Cholesterol

### LDL Cholesterol ("Bad" Cholesterol)
Low-density lipoprotein (LDL) cholesterol carries cholesterol particles throughout your body. LDL cholesterol builds up in the walls of your arteries, making them hard and narrow.

**Optimal levels:**
- Less than 100 mg/dL: Optimal
- 100-129 mg/dL: Near optimal
- 130-159 mg/dL: Borderline high
- 160-189 mg/dL: High
- 190 mg/dL and above: Very high

### HDL Cholesterol ("Good" Cholesterol)
High-density lipoprotein (HDL) cholesterol absorbs cholesterol and carries it back to the liver, which flushes it from the body.

**Optimal levels:**
- 60 mg/dL and above: High (protective against heart disease)
- 40 mg/dL and above for men: Acceptable
- 50 mg/dL and above for women: Acceptable
- Below 40 mg/dL for men: Low (risk factor)
- Below 50 mg/dL for women: Low (risk factor)

## Improving Your Cholesterol

### Dietary Changes
1. **Reduce saturated fats** - Found in red meat and dairy products
2. **Eliminate trans fats** - Often found in processed foods
3. **Eat omega-3 fatty acids** - Found in salmon, walnuts, and flaxseeds
4. **Increase soluble fiber** - Found in oats, beans, and fruits

### Lifestyle Modifications
- **Exercise regularly** - Aim for 150 minutes of moderate activity per week
- **Lose weight** - Even a 5-10% weight loss can help
- **Quit smoking** - Improves HDL cholesterol
- **Limit alcohol** - Moderate consumption may help raise HDL

## When to See Your Doctor

Contact your healthcare provider if:
- Your total cholesterol is above 240 mg/dL
- Your LDL is above 160 mg/dL
- Your HDL is below 40 mg/dL (men) or 50 mg/dL (women)
- You have other risk factors for heart disease

Remember, these numbers are just one part of your overall health picture. Work with your healthcare provider to understand what your specific numbers mean for you.`,
  },
  {
    title: "The Mediterranean Diet: Your Heart's Best Friend",
    "reference link": "",
    content: `# The Mediterranean Diet: Your Heart's Best Friend

The Mediterranean diet has been extensively studied and proven to be one of the most effective eating patterns for heart health, longevity, and overall wellness.

## What is the Mediterranean Diet?

The Mediterranean diet is based on the traditional eating patterns of countries bordering the Mediterranean Sea, including Greece, Italy, Spain, and southern France.

### Core Components

**Primary Foods (Daily):**
- Vegetables and fruits
- Whole grains
- Legumes and nuts
- Olive oil as the primary fat source
- Herbs and spices

**Secondary Foods (Weekly):**
- Fish and seafood (2-3 times per week)
- Poultry (2-3 times per week)
- Eggs (up to 4 per week)
- Dairy products (moderate amounts)

**Occasional Foods (Monthly):**
- Red meat (limited)
- Processed foods (minimal)
- Sweets (occasional treats)

## Health Benefits

### Cardiovascular Health
- **50% reduction** in heart disease risk
- **Lower blood pressure** and improved circulation
- **Reduced inflammation** markers like CRP
- **Better cholesterol profiles** with higher HDL

### Metabolic Benefits
- Improved insulin sensitivity
- Better blood sugar control
- Reduced risk of type 2 diabetes
- Healthy weight management

### Cognitive Health
- Reduced risk of Alzheimer's disease
- Better memory and cognitive function
- Lower rates of depression
- Improved mood and mental clarity

## Getting Started

### Week 1: Foundation
1. **Switch to olive oil** for cooking and dressings
2. **Add a serving of nuts** to your daily routine
3. **Include fish** in 2 meals this week
4. **Eat more vegetables** with each meal

### Week 2: Expansion
1. **Try new whole grains** like quinoa and farro
2. **Add legumes** to soups and salads
3. **Use herbs and spices** instead of salt
4. **Have fruit** for dessert instead of sweets

### Week 3: Integration
1. **Plan Mediterranean meals** for the entire week
2. **Try new recipes** from different Mediterranean countries
3. **Enjoy meals socially** when possible
4. **Include a glass of red wine** with dinner (optional)

The Mediterranean diet isn't just about food—it's a lifestyle that emphasizes fresh, whole foods, social eating, and mindful consumption.`,
  },
  {
    title: "Stress and Your Health: Breaking the Cycle",
    "reference link": "",
    content: `# Stress and Your Health: Breaking the Cycle

Chronic stress is one of the most significant yet overlooked factors affecting your health biomarkers. Understanding this connection is crucial for optimal wellness.

## How Stress Affects Your Body

### Immediate Stress Response
When you encounter stress, your body releases hormones like cortisol and adrenaline. This "fight-or-flight" response is designed to help you handle short-term threats.

### Chronic Stress Impact
When stress becomes chronic, these hormonal changes can seriously impact your health:

**Cardiovascular Effects:**
- Increased blood pressure
- Elevated heart rate
- Higher cholesterol levels
- Increased inflammation (elevated CRP)

**Metabolic Consequences:**
- Insulin resistance
- Higher blood glucose
- Weight gain (especially abdominal)
- Disrupted sleep patterns

## Effective Stress Management Strategies

### Mind-Body Techniques

**1. Meditation and Mindfulness**
- Start with 5 minutes daily
- Use apps like Headspace or Calm
- Practice deep breathing exercises
- Try body scan meditation

**2. Progressive Muscle Relaxation**
- Tense and release muscle groups
- Start from toes, work up to head
- Practice 10-15 minutes before bed

### Physical Strategies

**1. Regular Exercise**
- Cardio: 30 minutes, 5 times per week
- Strength training: 2-3 times per week
- Nature walks: Proven to reduce cortisol
- Swimming: Low-impact stress relief

**2. Sleep Optimization**
- Maintain consistent sleep schedule
- Create a relaxing bedtime routine
- Limit screens 1 hour before bed
- Keep bedroom cool and dark

Remember, managing stress is not about eliminating it completely—it's about developing healthy ways to cope with life's inevitable challenges.`,
  },
];

export function normalizeEducationalItems(raw: unknown): EducationalItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = String(row.title ?? row.name ?? "").trim();
      const content = String(row.content ?? row.description ?? "").trim();
      const reference =
        String(
          row["reference link"] ??
            row.referenceLink ??
            row.reference_link ??
            row.link ??
            "",
        ).trim();
      if (!title) return null;
      return {
        title,
        content,
        "reference link": reference,
      } satisfies EducationalItem;
    })
    .filter((item): item is EducationalItem => item !== null);
}
