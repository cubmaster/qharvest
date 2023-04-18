
rm /Users/wmcclellan001/Code/pwc/enterprise-gateway/enterprise-gateway/charts/enterprise-gateway-0.1.0.tgz
helm  package .  -d ./charts --app-version "1" 
helm install enterprise-gateway ./charts/enterprise-gateway-0.1.0.tgz  -n enterprise-gateway