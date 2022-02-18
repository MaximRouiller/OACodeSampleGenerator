const path = require(`path`);

exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions;

  const versionPage = path.resolve('src/pages/version.js');
  const operationPage = path.resolve('src/pages/operation.js');

  return graphql(`
    query {
      allSamplesJson {
        edges {
          node {
            apiInfo {
              title
              version
            }
            generated {
              operationId
              csharpModel
              csharpSnippet
              javaModel
              javaSnippet
              pythonModel
              pythonSnippet
              requestBody
            }
          }
        }
      }
    }
  `).then((result) => {
    if (result.errors) throw result.errors;

    result.data.allSamplesJson.edges.forEach((edge) => {
      const { apiInfo, generated } = edge.node;

      createPage({
        path: `service/${apiInfo.title}/${apiInfo.version}`,
        component: versionPage,
        context: {
          service: apiInfo.title,
          version: apiInfo.version,
          generated,
        },
      });

      generated.forEach((operation) =>
        createPage({
          path: `service/${apiInfo.title}/${apiInfo.version}/${operation.operationId}`,
          component: operationPage,
          context: {
            service: apiInfo.title,
            version: apiInfo.version,
            operation,
          },
        })
      );
    });
  });
};
