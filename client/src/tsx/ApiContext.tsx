import { createContext } from "react";
import { Api } from "./Api";

export var ApiContext = createContext(new Api())

