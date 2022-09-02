FROM node:12

ENV TARGET ""
ENV FILE ""
ENV DEFAULT_FORBID_ADDITIONAL_PROPERTIES ""
ENV SILENT ""
ENV VERBOSE ""
ENV NODE_ENV "production"

WORKDIR /openapi-cop-docker
COPY package.json .
RUN npm install --only=prod
COPY build/ .
COPY entrypoint.bash .

EXPOSE 8888

ENTRYPOINT ["/bin/bash", "./entrypoint.bash"]
