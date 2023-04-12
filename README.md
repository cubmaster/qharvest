# Qharvest

------

## Install Steps

If you are windows, work from a linux command in
the [Windows linux Subsystem](https://learn.microsoft.com/en-us/windows/wsl/install)
For Kubernetes work you should download and install [Lens](https://k8slens.dev/)

1. Make sure your local docker kubernetes is running
2. Make a namespace in your kubernetes called "enterprise-gateway". This can be done via the lens Ui or from the command
   line using `kubectl create namespace
   enterprise-gateway`
3. From a linux command line in a terminal that you created the namespace or in a Lens terminal run `sh buildRun.sh`.
   This will create the helm chart from the files in the k8s  
