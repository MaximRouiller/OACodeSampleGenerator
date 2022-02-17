import React from 'react';
import { Link, useStaticQuery, graphql } from 'gatsby';
import { Box, Flex, Divider, Heading, Text } from '@chakra-ui/react';

const Layout = ({ pageTitle, children }) => {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }
      allSamplesJson {
        edges {
          node {
            apiInfo {
              title
              version
            }
          }
        }
      }
    }
  `);

  const services = [];

  for (const edge of data.allSamplesJson.edges) {
    const { title, version } = edge.node.apiInfo;
    const service = services.find((s) => s.title === title);
    if (service) {
      service.versions.push(version);
    } else {
      services.push({ title, versions: [version] });
    }
  }

  return (
    <Box m={5}>
      <title>
        {pageTitle} | {data.site.siteMetadata.title}
      </title>
      <Link to='/'>
        <Heading fontSize={25}>Azure REST API Code Samples</Heading>
      </Link>
      <Flex mt={5}>
        <Flex direction='column' width='fit-content'>
          <Heading fontSize={20} mb={5}>
            Services
          </Heading>
          {services.map(({ title, versions }) => (
            <Box key={title}>
              <Text>{title}</Text>
              <Flex direction='column'>
                {versions.map((version) => (
                  <Link to={`/service/${title}/${version}`} key={title + version}>
                    {version}
                  </Link>
                ))}
              </Flex>
              <Divider my={2} />
            </Box>
          ))}
        </Flex>
        <Flex direction='column' ml={5}>
          <Heading fontSize={20} mb={5}>
            {pageTitle}
          </Heading>
          {children}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Layout;
