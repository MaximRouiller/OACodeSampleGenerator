import React, { useState } from 'react';
import { Box, Flex, Heading, Button } from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

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
              <SamplePanel sample={operation.javaSnippet} />
            </TabPanel>
            <TabPanel>
              <SamplePanel sample={operation.pythonSnippet} />
            </TabPanel>
            <TabPanel>
              <SamplePanel sample={operation.csharpSnippet} />
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
              <SamplePanel sample={operation.requestBody} />
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
              <SamplePanel sample={operation.javaModel} />
            </TabPanel>
            <TabPanel>
              <SamplePanel sample={operation.pythonModel} />
            </TabPanel>
            <TabPanel>
              <SamplePanel sample={operation.csharpModel} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Layout>
  );
};

const SamplePanel = ({ sample }) => {
  const [showCopied, setShowCopied] = useState(false);

  const onCopy = () => {
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <Box position='relative'>
      {sample && (
        <CopyToClipboard text={sample} onCopy={onCopy}>
          <Button size='sm' colorScheme='blue' position='absolute' right={0}>
            {showCopied ? 'Copied' : 'Copy'}
          </Button>
        </CopyToClipboard>
      )}
      <pre style={{ whiteSpace: 'pre-wrap' }}>{sample}</pre>
    </Box>
  );
};

export default OperationPage;
