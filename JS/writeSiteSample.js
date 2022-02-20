const fs = require('fs');
const generator = require('./index');

(async () => {
  // Pass in a specification URL as a third command line argument -> node writeSiteSample url

  try {
    const output = await generator(process.argv[2]);
    const { apiInfo } = output;

    console.log(`API name: ${apiInfo.title}, Version: ${apiInfo.version}`);

    fs.writeFileSync(
      `../azure-code-samples-site/samples/${apiInfo.title}_${apiInfo.version}.json`,
      JSON.stringify(output, null, 2)
    );
  } catch (err) {
    console.error(err);
  }
})();
