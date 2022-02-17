import React from 'react';
import { Flex, Heading } from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';

import Layout from '../components/layout';

const OperationPage = ({ pageContext }) => {
  const { service, version, operation } = pageContext;

  return (
    <Layout pageTitle={service + ' - ' + version + ' - ' + operation.operationId}>
      <Flex direction='column'>
        <Heading fontSize={15} mb={2}>
          Request
        </Heading>
        <Tabs mb={2}>
          <TabList>
            <Tab>Java</Tab>
            <Tab>Python</Tab>
            <Tab>C#</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <pre>{operation.javaSnippet}</pre>
            </TabPanel>
            <TabPanel>
              <pre>{operation.pythonSnippet}</pre>
            </TabPanel>
            <TabPanel>
              <pre>{operation.csharpSnippet}</pre>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Heading fontSize={15} my={2}>
          Request Body
        </Heading>
        <Tabs mb={2}>
          <TabList>
            <Tab>JSON</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <pre>{operation.requestBody}</pre>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Heading fontSize={15} my={2}>
          Response Model
        </Heading>
        <Tabs>
          <TabList>
            <Tab>Java</Tab>
            <Tab>Python</Tab>
            <Tab>C#</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <pre>{operation.javaModel}</pre>
            </TabPanel>
            <TabPanel>
              <pre>{operation.pythonModel}</pre>
            </TabPanel>
            <TabPanel>
              <pre>{operation.csharpModel}</pre>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Layout>
  );
};

export default OperationPage;
