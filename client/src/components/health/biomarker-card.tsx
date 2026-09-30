import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBiomarkerStatus, getBiomarkerStatusColor, getBiomarkerStatusBg, cn } from "@/lib/utils";
import { formatLabCalendarDate } from "@/lib/labCalendarDate";

interface BiomarkerCardProps {
  name: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  testDate?: string;
  className?: string;
}

export default function BiomarkerCard({
  name,
  value,
  unit,
  referenceMin,
  referenceMax,
  testDate,
  className
}: BiomarkerCardProps) {
  const status = getBiomarkerStatus(value, referenceMin, referenceMax);
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Low';
      case 'high':
        return 'High';
      default:
        return 'Unknown';
    }
  };

  const getProgressWidth = () => {
    if (!referenceMin || !referenceMax) return 50;
    
    const range = referenceMax - referenceMin;
    const position = ((value - referenceMin) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const getProgressColor = () => {
    switch (status) {
      case 'normal':
        return 'bg-green-500';
      case 'low':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{name}</h4>
          <Badge 
            className={cn(
              "text-xs font-medium",
              getBiomarkerStatusBg(status),
              getBiomarkerStatusColor(status),
              "border-0"
            )}
          >
            {getStatusLabel(status)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value.toLocaleString()}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>
        </div>
        
        {referenceMin && referenceMax && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={cn("rounded-full h-2 transition-all duration-500", getProgressColor())}
                  style={{ width: `${getProgressWidth()}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{referenceMin}</span>
              <span className="text-gray-600 dark:text-gray-300">
                Normal: {referenceMin} - {referenceMax} {unit}
              </span>
              <span>{referenceMax}</span>
            </div>
          </div>
        )}
        
        {testDate && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Tested: {formatLabCalendarDate(testDate)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
