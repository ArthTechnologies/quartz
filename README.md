[![Get at Docker Hub](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/arthmc/quartz)

### Warnings:

- Arth Panel is in beta and should not be used in production yet.
- There are several issues with the docker image currently, and we recommend running quartz directly for now.

Documentation can be found [here](https://codeberg.org/arth/quartz/wiki)

# Quartz

Quartz is a backend for Arth Panel, a lightweight self-hosted Minecraft server panel. Quartz is made with Node and Express.

## Why Arth Panel?
The main panels currently used for running Minecraft servers are bulky, slow, hard to setup, and hard to understand. It could be quite time-consuming to figure out where your servers actually are if you ever choose to ditch a panel like pufferpanel or pterodactyl. So Arth Panel was built from the ground up, with simplicity, design, and performance in mind. It doesn't use docker to contain your servers, so they're right there in the "servers" folder if you ever have a problem with Arth Panel and need to run them directly.

## How to run

1. Grab the source code with `git clone https://codeberg.org/arth/quartz`
2. Install the packages with `npm i`
3. Run with `node run`

## How to configure

- stores/settings.json is where you can modify settings.
- stores/secrets.json is where you can enter your stripe key if you want payments enabled.
- Advanced: If you want to set up quartz to be proxied by ocelot (a master backend that connects quartz instances), you can use the `POST /node/forwardingSecret` route. Specify the `forwardingSecret` as a query parameter.

## How to run with docker (Unsupported)

1. Download the image from docker hub with the command `sudo docker pull arthmc/quartz:latest`
2. Run the image with `sudo docker run -p 4000:4000 arthmc/quartz:latest`. To change the port, replace the first 4000 with the port number you want.

# Dependencies

- Arth Uses the `curl` command to download plugins and the `convert` command to downscale images. If you want these functionalities, you'll need to install those commands.

# Contributing

To run a dev server, follow steps 1 and 2 in "how to run" and then run `npm run dev` instead of `node run`.

## Contributing Guidelines

- Please format your code with the Prettier VSCode extension or an alternative that achieves the same results.

### Check out our [frontend](https://github.com/arthmc/observer)'s progress

# To-do list

✅ Basic file data storage that stores details about servers  
✅ Basic API that provides details about servers to frontend  
✅ Ability to run Minecraft servers with specified versions and softwares  
✅ Basic communication with frontend for terminal  
✅ Consistent routes  
✅ Locking a customer's assets behing a password  
✅ Add support for plugins and mods from modrinth  
🛠️ Make no-stripe/no account modes more stable  
🛠️ Make modded servers stable  
🛠️ Add support for ocelot (master backend)  
❓ Protecting customer assets with end-to-end encryption  
❓ Add support for mods/plugins from CurseForge
