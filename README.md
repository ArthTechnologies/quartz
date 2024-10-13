API Documentation can be found [here](https://arthmc.xyz/software/). If you're a developer interested in contributing, make sure you're on our `next` branch to see the code for the next update.

# Quartz

Quartz is a backend for Arth Panel, a lightweight self-hosted Minecraft server panel. Quartz is made with Node and Express.

## Requirements
- Arth Panel only supports Linux operating systems such as Ubuntu Server.
- Arth Panel now requires Docker, as features like file uploading could otherwise pose a security vulnerability. 
- Make sure that docker commands can be run without root permissions. To do this on Ubuntu, run `sudo usermod -aG docker $USER` and restart your computer.

## How to run

1. Grab the source code with `git clone https://codeberg.org/arth/quartz`
2. Install the packages with `npm i`
3. Run with `sh start.sh`

You can update quartz by running `git pull` command inside your quartz folder.

## How to configure

- `config.txt` is where you can configure settings and provide API keys if you want to enable curseForge or stripe support.

# Dependencies

- Arth Uses the `curl` command to download plugins and the `convert` command to downscale images. If you want these functionalities, you'll need to install those commands. In addition, the `start.sh` script utilizes the `screen` command, so ensure that it is installed.

# Contributing

Make sure to run `git checkout next` to switch to the next branch, where future updates are being worked on.

### Check out our frontend, [Observer](https://github.com/arthmc/observer).
