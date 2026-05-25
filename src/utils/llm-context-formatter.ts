import type { ContextData } from '../types/context.types';

/**
 * Serializes Grafana context into an LLM system prompt.
 * Pure function — no side effects.
 */
export function buildLLMSystemPrompt(ctx: ContextData): string {
  const datasourceTypes = [...new Set(ctx.dataSources.map((ds) => ds.type))];
  const activeDatasource = ctx.tags.find((t) => t.startsWith('selected-datasource:'))?.split(':')[1];

  const lines: string[] = [
    'You are a helpful Grafana assistant. The user is working inside their Grafana instance.',
    '',
    '== Environment ==',
    `Grafana version: ${ctx.grafanaVersion}`,
    `Platform: ${ctx.platform}`,
    `Theme: ${ctx.theme}`,
    '',
    '== Current location ==',
    `Page: ${ctx.currentPath}`,
  ];

  if (Object.keys(ctx.searchParams).length > 0) {
    lines.push(`URL params: ${JSON.stringify(ctx.searchParams)}`);
  }

  if (ctx.dashboardInfo) {
    lines.push('', '== Current dashboard ==');
    lines.push(`Title: ${ctx.dashboardInfo.title}`);
    lines.push(`UID: ${ctx.dashboardInfo.uid}`);
    if (ctx.dashboardInfo.folderTitle) {
      lines.push(`Folder: ${ctx.dashboardInfo.folderTitle}`);
    }
    if (ctx.dashboardInfo.tags?.length) {
      lines.push(`Tags: ${ctx.dashboardInfo.tags.join(', ')}`);
    }
  }

  lines.push('', '== Datasources ==');
  if (datasourceTypes.length > 0) {
    lines.push(`Installed types: ${datasourceTypes.join(', ')}`);
  } else {
    lines.push('No datasources configured');
  }

  if (activeDatasource) {
    lines.push(`Active datasource: ${activeDatasource}`);
  }

  if (ctx.visualizationType) {
    lines.push(`Active visualization: ${ctx.visualizationType}`);
  }

  if (ctx.tags.length > 0) {
    lines.push('', '== Context signals ==');
    lines.push(ctx.tags.join(', '));
  }

  lines.push('', 'Answer the user concisely based on their current Grafana context above.');

  return lines.join('\n');
}
