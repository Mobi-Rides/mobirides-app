import { z } from 'zod';

const SCRIPT_TAG_REGEX = /<\/?(?:script|iframe|object|embed|applet|form|input|button|link)/gi;
const HTML_TAG_REGEX = /<[^>]*>/g;
const EVENT_HANDLER_REGEX = /\bon\w+\s*=/gi;
const JAVASCRIPT_URI_REGEX = /javascript\s*:/gi;
const DATA_URI_REGEX = /data\s*:/gi;

export const stripHtmlTags = (input: string): string => {
  return input.replace(HTML_TAG_REGEX, '');
};

export const removeScriptTags = (input: string): string => {
  return input.replace(SCRIPT_TAG_REGEX, '');
};

export const removeEventHandlers = (input: string): string => {
  return input.replace(EVENT_HANDLER_REGEX, '');
};

export const removeJavascriptUris = (input: string): string => {
  return input.replace(JAVASCRIPT_URI_REGEX, '#removed:');
};

export const sanitizeHtml = (input: string): string => {
  let result = input;
  result = result.replace(SCRIPT_TAG_REGEX, '');
  result = result.replace(HTML_TAG_REGEX, '');
  result = result.replace(EVENT_HANDLER_REGEX, '');
  result = result.replace(JAVASCRIPT_URI_REGEX, '#removed:');
  result = result.replace(DATA_URI_REGEX, '#removed:');
  return result;
};

export const sanitizeBasic = (input: string): string => {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, 10000);
};

export const sanitizeName = (input: string): string => {
  return sanitizeHtml(input)
    .replace(/[<>]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
};

export const sanitizeDescription = (input: string): string => {
  return sanitizeHtml(input).trim();
};

export const sanitizeEmail = (input: string): string => {
  return input.toLowerCase().trim().slice(0, 254);
};

export const sanitizePhone = (input: string): string => {
  return input.replace(/\D/g, '').slice(0, 15);
};

export const sanitizedString = (min: number = 1, max: number = 1000) =>
  z.string()
    .min(min)
    .max(max)
    .transform((val) => sanitizeHtml(val));

export const sanitizedName = (min: number = 2, max: number = 100) =>
  z.string()
    .min(min, 'Too short')
    .max(max, 'Too long')
    .transform((val) => sanitizeName(val));

export const sanitizedDescription = (min: number = 0, max: number = 5000) =>
  z.string()
    .min(min)
    .max(max)
    .transform((val) => sanitizeDescription(val));