# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

# start from the jupyter image with R, Python, and Scala (Apache Toree) kernels pre-installed
FROM jupyter/all-spark-notebook:latest

# install the kernel gateway
RUN pip install --no-cache-dir jupyter_kernel_gateway

# run kernel gateway on container start, not notebook server
EXPOSE 8888
CMD ["jupyter", "kernelgateway", "--KernelGatewayApp.log_level=DEBUG", "--KernelGatewayApp.ip=0.0.0.0", "--KernelGatewayApp.port=8888", "--KernelGatewayApp.allow_origin='*'", "--KernelGatewayApp.allow_methods='*'", "--KernelGatewayApp.allow_credentials='true'", "--KernelGateway.allow_headers='*'", "--KernelGatewayApp.expose_headers='*'", "--KernelGatewayApp.answer_yes=True" ]
#
