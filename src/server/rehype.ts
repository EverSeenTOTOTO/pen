export const renderError = (e: Error) => `
\`\`\`txt
${e.message}

${e.stack}
\`\`\`
`;

// TODO
export const renderMarkdown = () => ({
  type: 'markdown',
  content: '<h1>Markdown</h1>',
});
