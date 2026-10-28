import { useDispatch } from "react-redux";
import type { ApiDispatch } from "./api-provider";
export const useApiDispatch = useDispatch.withTypes<ApiDispatch>();
