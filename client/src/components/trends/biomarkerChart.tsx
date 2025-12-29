import React, { useEffect, useState } from "react";
import Toggle from "./Toggle";
import StatusBarChartv3 from "./StatusBarChartv3";
import HistoricalChart from "./HistoricalChart";

interface biomarkerChartProps {
  biomarker: any;
  isCheced: boolean;
}

const BiomarkerChart = ({ biomarker, isCheced }: biomarkerChartProps) => {
  const [active, setActive] = useState<any>(biomarker);
  useEffect(() => {
    if (biomarker != null) {
      setActive(biomarker);
    }
  }, [biomarker]);
  return (
    <>
      <div className="flex-grow gap-2 relative flex items-center justify-center">
        {!isCheced ? (
          <div className="w-full ">
            <div className={`w-full bg-white dark:bg-gray-800`}>
              <div className=" w-full h-[85px]">
                <div className="w-full">
                  <div className="my-1 flex w-full justify-between items-center text-[10px] text-[#383838] dark:text-gray-300">
                    Current Value
                  </div>
                  <div className="mt-10">
                    {biomarker && (
                      <StatusBarChartv3
                        status={biomarker.status}
                        unit={biomarker.unit}
                        values={biomarker.values}
                        data={biomarker.chart_bounds}
                      ></StatusBarChartv3>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full ">
            <div className={`w-full bg-white dark:bg-gray-800`}>
              <div className=" w-full h-[115px]">
                <div className="w-full">
                  <div className="my-1 flex w-full justify-between items-center text-[10px] text-[#383838] dark:text-gray-300">
                    Historical Data
                  </div>
                  <div className="w-full">
                    {active && (
                      <HistoricalChart
                        statusBar={active?.chart_bounds}
                        dataStatus={active.status}
                        dataPoints={[...active.values]}
                        labels={[...active.date]}
                      ></HistoricalChart>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BiomarkerChart;
