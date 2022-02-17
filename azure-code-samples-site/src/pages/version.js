import React from 'react';
import { Link } from 'gatsby';
import { Box, Flex, Divider } from '@chakra-ui/react';

import Layout from '../components/layout';

const VersionPage = ({ pageContext }) => {
  const { service, version, generated } = pageContext;

  return (
    <Layout pageTitle={service + ' - ' + version}>
      <Flex direction='column'>
        {generated.map((operation) => {
          const operationId = operation.operationId;
          return (
            <Box key={operationId}>
              <Link to={`./${operationId}`}>{operationId}</Link>
              <Divider my={2} />
            </Box>
          );
        })}
      </Flex>
    </Layout>
  );
};

export default VersionPage;
