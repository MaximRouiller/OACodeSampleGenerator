
class _TemplateLink:
	uri = ""
	id = ""
	relativePath = ""
	contentVersion = ""
	queryString = ""

class _ParametersLink:
	uri = ""
	contentVersion = ""

class _DebugSetting:
	detailLevel = ""

class _OnErrorDeployment:
	provisioningState = ""
	type = ""
	deploymentName = ""

class LocationMapping:
	location = ""
	type = ""
	extendedLocations = 

class _DefaultPattern:
	phrase = ""
	variable = ""
	type = ""

class _DefaultMetadata:
	type = ""
	attributes = ""

class _Pattern:
	phrase = ""
	variable = ""
	type = ""

class _Metadata:
	type = ""
	attributes = ""

class Path:
	path = ""
	apiVersions = 
	pattern = _Pattern()
	Pattern = _Pattern
	metadata = _Metadata()
	Metadata = _Metadata

class Alias:
	name = ""
	paths = 
	Paths = _Paths
	type = ""
	defaultPath = ""
	defaultPattern = _DefaultPattern()
	DefaultPattern = _DefaultPattern
	defaultMetadata = _DefaultMetadata()
	DefaultMetadata = _DefaultMetadata

class ZoneMapping:
	location = ""
	zones = 

class ApiProfile:
	profileVersion = ""
	apiVersion = ""

class ResourceType:
	resourceType = ""
	locations = 
	locationMappings = 
	LocationMappings = _LocationMappings
	aliases = 
	Aliases = _Aliases
	apiVersions = 
	defaultApiVersion = ""
	zoneMappings = 
	ZoneMappings = _ZoneMappings
	apiProfiles = 
	ApiProfiles = _ApiProfiles
	capabilities = ""
	properties = {}

class Provider:
	id = ""
	namespace = ""
	registrationState = ""
	registrationPolicy = ""
	resourceTypes = 
	ResourceTypes = _ResourceTypes
	providerAuthorizationConsentState = ""

class DependsOn:
	id = ""
	resourceType = ""
	resourceName = ""

class Dependency:
	dependsOn = 
	DependsOn = _DependsOn
	id = ""
	resourceType = ""
	resourceName = ""

class OutputResource:
	id = ""

class ValidatedResource:
	id = ""

class _Properties:
	provisioningState = ""
	correlationId = ""
	timestamp = ""
	duration = ""
	outputs = {}
	providers = 
	Providers = _Providers
	dependencies = 
	Dependencies = _Dependencies
	templateLink = _TemplateLink()
	TemplateLink = _TemplateLink
	parameters = {}
	parametersLink = _ParametersLink()
	ParametersLink = _ParametersLink
	mode = ""
	debugSetting = _DebugSetting()
	DebugSetting = _DebugSetting
	onErrorDeployment = _OnErrorDeployment()
	OnErrorDeployment = _OnErrorDeployment
	templateHash = ""
	outputResources = 
	OutputResources = _OutputResources
	validatedResources = 
	ValidatedResources = _ValidatedResources
	error = {}

class Deployments_CreateOrUpdateAtScope:
	id = ""
	name = ""
	type = ""
	location = ""
	properties = _Properties()
	Properties = _Properties
	tags = {}
