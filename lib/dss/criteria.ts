import type {CarPreference,PriorityKey} from "@/types";
export const criteria: {key: PriorityKey; label: string; description: string}[] = [
  {key:"reliability",label:"Reliability",description:"Dependability, using the listing’s reliability rating."},
  {key:"fuelEconomy",label:"Fuel economy",description:"Efficiency ratings to help weigh everyday running costs."},
  {key:"maintenance",label:"Maintenance",description:"A higher rating means more affordable maintenance."},
  {key:"comfort",label:"Comfort",description:"The listing’s assessment of ride and cabin comfort."},
  {key:"performance",label:"Performance",description:"How the vehicle is rated for power and driving ability."},
  {key:"practicality",label:"Practicality",description:"Everyday usefulness, alongside your required seat count."},
  {key:"appearance",label:"Body condition",description:"Recorded exterior condition, rather than brand prestige."},
];
export const defaultPreference:CarPreference = {priorities:{fuelEconomy:.75,reliability:1,maintenance:.75,comfort:.5,performance:.25,practicality:.5,appearance:.25},usages:[],hardConstraints:[],missingInformation:[],clarificationRequired:false,interpretedSummary:"Your selected budget, requirements and priorities."};
