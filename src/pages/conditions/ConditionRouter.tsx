import { useParams, Navigate } from "react-router-dom";
import ChronicPain from "./ChronicPain";
import Anxiety from "./Anxiety";
import ComplexRegionalPainSyndrome from "./ComplexRegionalPainSyndrome";

const ConditionRouter = () => {
  const { conditionId } = useParams<{ conditionId: string }>();

  const conditionComponents: { [key: string]: JSX.Element } = {
    "chronic-pain": <ChronicPain />,
    "anxiety": <Anxiety />,
    "complex-regional-pain-syndrome": <ComplexRegionalPainSyndrome />,
    // Add more conditions here as they are created
  };

  const component = conditionComponents[conditionId || ""];
  
  if (!component) {
    return <Navigate to="/conditions" replace />;
  }

  return component;
};

export default ConditionRouter;
