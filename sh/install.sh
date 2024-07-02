#!/usr/bin/env bash
{ # this ensures the entire script is downloaded #
echo installing ...
mkdir ~/izyware;
cd ~/izyware;
git clone https://github.com/izyware/devops.git;
cd devops;
npm install;
npm link;
echo izy.devops installed
} # this ensures the entire script is downloaded #
