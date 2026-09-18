import React, { useEffect, useState } from "react";
import StatusBarChartv3 from "./StatusBarChartv3";

interface biomarkerChartProps {
  biomarker: any;
  isCheced?: boolean;
}

const BiomarkerChart = ({ biomarker }: biomarkerChartProps) => {
  const [active, setActive] = useState<any>(biomarker);
  useEffect(() => {
    if (biomarker != null) {
      setActive(biomarker);
    }
  }, [biomarker]);
  return (
    <>
      <div className="flex-grow gap-2 relative flex items-center justify-center">
        <div className="w-full ">
          <div className={`w-full bg-white`}>
            <div className=" w-full h-[85px]">
              <div className="w-full">
                <div className="my-1 flex w-full justify-between items-center text-[10px] text-[#383838]">
                  Current Value
                </div>
                <div className="mt-10">
                  {active && (
                    <StatusBarChartv3
                      status={active.status}
                      unit={active.unit}
                      values={active.values}
                      data={active.chart_bounds}
                    ></StatusBarChartv3>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BiomarkerChart;
