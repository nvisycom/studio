/**
 * Position coordinates for context menus and drop targets
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Extension configuration for Extension Switch node
 */
export interface ExtensionConfig {
  id: string;
  label: string;
  enabled: boolean;
}

/**
 * Language configuration for Language Switch node
 */
export interface LanguageConfig {
  id: string;
  label: string;
  code: string;
  enabled: boolean;
}

/**
 * Content type configuration for Content Switch node
 */
export interface ContentTypeConfig {
  id: string;
  label: string;
  enabled: boolean;
}
