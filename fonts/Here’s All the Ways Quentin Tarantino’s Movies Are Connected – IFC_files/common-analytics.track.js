// load configuration of the common analytics as well as definitions.
_ca = new CommonAnalytics(_ca_config);

// set page level context
_ca._defaultValues = _ca_page_contexts;

// do inital pagview
_ca.trackPageView({'omniture_enabled': false});
