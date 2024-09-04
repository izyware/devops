#!/usr/bin/env bash
{ # this ensures the entire script is downloaded #
echo installing ...
mkdir ~/izyware;
cd ~/izyware;
rm master.zip;
curl -LO https://github.com/izyware/devops/archive/refs/heads/master.zip;
unzip master.zip;
mv devops-master devops;
rm master.zip;
cd devops;
npm install;
sudo npm link;
echo izy.devops installed
} # this ensures the entire script is downloaded #
