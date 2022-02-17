import React from 'react';
import { Link as GatsbyLink } from 'gatsby';
import { Box, Flex, Divider, Link } from '@chakra-ui/react';

import Layout from '../components/layout';

const VersionPage = ({ pageContext }) => {
  const { service, version, generated } = pageContext;

  return (
    <Layout pageTitle={service + ' - ' + version}>
      <Flex direction='column'>
        {generated.map(({ operationId }) => (
          <Box key={operationId}>
            <Link as={GatsbyLink} to={`./${operationId}`}>
              {operationId}
            </Link>
            <Divider my={2} />
          </Box>
        ))}
      </Flex>
    </Layout>
  );
};

export default VersionPage;
