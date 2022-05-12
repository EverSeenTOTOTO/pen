export const renderError = (e: Error) => `
\`\`\`txt
${e.message}

${e.stack}
\`\`\`
`;
