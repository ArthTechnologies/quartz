[![Get at Docker Hub](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/r/arthmc/quartz)

# Arth Panel Beta 1.5
This version was released on Aug 14, 2024. Please see the `next` branch for development on the next version

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

You can update quartz by running `git pull` command inside your quartz folder.

## How to configure

- config.txt is where you can configure settings and provide API keys if you want to enable curseForge or stripe support.
- Advanced: If you want to set up quartz to be proxied by ocelot (a master backend that connects quartz instances), you can use the `POST /node/forwardingSecret` route. Specify the `forwardingSecret` as a query parameter.

## How to run with docker (Unsupported)

1. Download the image from docker hub with the command `sudo docker pull arthmc/quartz:latest`
2. Run the image with `sudo docker run -p 4000:4000 10000-20000:10000-20000 arthmc/quartz:latest`. To change the port, replace the first 4000 with the port number you want.

If you are using an ARM-based machine (Like a Mac or Raspberry Pi):
1. Grab the source code with `git clone https://codeberg.org/arth/quartz`
2. Inside the quartz folder, run `docker buildx build --platform linux/arm64 . -t arthmc/quartz:latest`
2. Run the image with `sudo docker run -p 4000:4000 10000-20000:10000-20000 arthmc/quartz:latest`. To change the port, replace the first 4000 with the port number you want.

# Dependencies

- Arth Uses the `curl` command to download plugins and the `convert` command to downscale images. If you want these functionalities, you'll need to install those commands.

# Contributing

Make sure to run `git checkout next` to switch to the next branch, where future updates are being worked on.

## How to run a dev server

- Make sure you install/update the packages by running `npm i`
- To run a dev server, enter the command `npm run dev`
- If you need to mimic a production environment for something like working with Service Workers, enter `npm run preview` instead.

### Check out our [frontend](https://github.com/arthmc/observer)'s progress

# To-do list

✅ Basic file data storage that stores details about servers  
✅ Basic API that provides details about servers to frontend  
✅ Ability to run Minecraft servers with specified versions and softwares  
✅ Basic communication with frontend for terminal  
✅ Consistent routes  
✅ Secure accounts and servers with a password system  
✅ Add support for plugins, mods, and modpacks from modrinth  
✅ Add support for mods/modpacks from CurseForge  
🛠️ Make no-stripe/no account modes more stable  
🛠️ Make modded servers stable  
🛠️ Make discord accounts more stable  
🛠️ Add support for ocelot (master backend)  
❓ Protect customer assets with end-to-end encryption  

