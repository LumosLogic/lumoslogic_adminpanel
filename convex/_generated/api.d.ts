/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as blogPosts from "../blogPosts.js";
import type * as caseStudies from "../caseStudies.js";
import type * as clients from "../clients.js";
import type * as cloudinary from "../cloudinary.js";
import type * as cloudinaryConfig from "../cloudinaryConfig.js";
import type * as companyInfo from "../companyInfo.js";
import type * as companyValues from "../companyValues.js";
import type * as employees from "../employees.js";
import type * as faq from "../faq.js";
import type * as files from "../files.js";
import type * as jobs from "../jobs.js";
import type * as leadership from "../leadership.js";
import type * as products from "../products.js";
import type * as services from "../services.js";
import type * as teamPageOrder from "../teamPageOrder.js";
import type * as testimonials from "../testimonials.js";
import type * as timeline from "../timeline.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applications: typeof applications;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  blogPosts: typeof blogPosts;
  caseStudies: typeof caseStudies;
  clients: typeof clients;
  cloudinary: typeof cloudinary;
  cloudinaryConfig: typeof cloudinaryConfig;
  companyInfo: typeof companyInfo;
  companyValues: typeof companyValues;
  employees: typeof employees;
  faq: typeof faq;
  files: typeof files;
  jobs: typeof jobs;
  leadership: typeof leadership;
  products: typeof products;
  services: typeof services;
  teamPageOrder: typeof teamPageOrder;
  testimonials: typeof testimonials;
  timeline: typeof timeline;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
