class Deployments_CreateOrUpdateAtScope {
  String id;
  String name;
  String type;
  String location;
  Properties properties;
  Object tags;

  class Properties {
    String provisioningState;
    String correlationId;
    String timestamp;
    String duration;
    Object outputs;
    List<Provider> providers;
    List<Dependency> dependencies;
    TemplateLink templateLink;
    Object parameters;
    ParametersLink parametersLink;
    String mode;
    DebugSetting debugSetting;
    OnErrorDeployment onErrorDeployment;
    String templateHash;
    List<OutputResource> outputResources;
    List<ValidatedResource> validatedResources;
    Object error;
  
    class TemplateLink {
      String uri;
      String id;
      String relativePath;
      String contentVersion;
      String queryString;
    }
  
    class ParametersLink {
      String uri;
      String contentVersion;
    }
  
    class DebugSetting {
      String detailLevel;
    }
  
    class OnErrorDeployment {
      String provisioningState;
      String type;
      String deploymentName;
    }
  
    class Provider {
      String id;
      String @namespace;
      String registrationState;
      String registrationPolicy;
      List<ResourceType> resourceTypes;
      String providerAuthorizationConsentState;
    
      class ResourceType {
        String resourceType;
        List<String> locations;
        List<LocationMapping> locationMappings;
        List<Alias> aliases;
        List<String> apiVersions;
        String defaultApiVersion;
        List<ZoneMapping> zoneMappings;
        List<ApiProfile> apiProfiles;
        String capabilities;
        Object properties;
      
        class LocationMapping {
          String location;
          String type;
          List<String> extendedLocations;
        }
      
        class Alias {
          String name;
          List<Path> paths;
          String type;
          String defaultPath;
          DefaultPattern defaultPattern;
          DefaultMetadata defaultMetadata;
        
          class DefaultPattern {
            String phrase;
            String variable;
            String type;
          }
        
          class DefaultMetadata {
            String type;
            String attributes;
          }
        
          class Path {
            String path;
            List<String> apiVersions;
            Pattern pattern;
            Metadata metadata;
          
            class Pattern {
              String phrase;
              String variable;
              String type;
            }
          
            class Metadata {
              String type;
              String attributes;
            }
          }
        }
      
        class ZoneMapping {
          String location;
          List<String> zones;
        }
      
        class ApiProfile {
          String profileVersion;
          String apiVersion;
        }
      }
    }
  
    class Dependency {
      List<DependsOn> dependsOn;
      String id;
      String resourceType;
      String resourceName;
    
      class DependsOn {
        String id;
        String resourceType;
        String resourceName;
      }
    }
  
    class OutputResource {
      String id;
    }
  
    class ValidatedResource {
      String id;
    }
  }
}

