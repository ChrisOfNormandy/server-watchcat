#!/bin/bash

INSTALL_PATH=server-watchcat

RELEASE_NAME=watchcat_1.1.0
RELEASE_TAG=beta-indev-1.1.0

echo "Welcome to the Server Watchcat service installer."
echo "This will install: $RELEASE_NAME"
echo "---"
echo "You must have the following installed:"
echo "- NodeJS v16+"
echo "- unzip"
echo "- Java / OpenJDK (8, 11 or 17 depending on your desired MC version)"
echo "- Firewall-CMD"
echo "---"
echo "This will overwrite existing files. Are you sure you want to continue?"

select yn in "Yes" "No"; do
    case $yn in
        Yes ) break;;
        No ) exit;;
    esac
done

if [[ $* == *-noapt* ]]
then
    echo "Skipping package installs."
else
    if ! command -v node &> /dev/null
    then
        echo "Node is not installed. Installing now."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    if ! command -v java &> /dev/null
    then
        echo "Java is not installed. Installing now."
        sudo apt-get install openjdk-11-jdk
    fi

    if ! command -v unzip &> /dev/null
    then
        echo "Java is not installed. Installing now."
        sudo apt-get install unzip
    fi

    if ! command -v firewall-cmd &> /dev/null
    then
        echo "firewall-cmd is not installed. Installing now."
        sudo apt-get install firewalld
    fi

    if sudo apt-get install build-essential
    then
        echo "Got build essential."
    fi
fi

if [[ $* == *-nonpm* ]]
then
    echo "Skipping NodeJS setup."
else
    echo "Setting up NodeJS requirements:"

    sudo npm install -g npm@latest
    sudo npm install -g yarn@latest
fi

if which systemctl > /dev/null
then
    echo "Stopping services (if they exist):"

    sudo systemctl stop watchcatbot
    sudo systemctl stop watchcatpanel
fi

echo "Fetching zip: $RELEASE_NAME.zip from GitHub"

cd ~

if curl -L -O https://github.com/ChrisOfNormandy/server-watchcat/releases/download/$RELEASE_TAG/$RELEASE_NAME.zip
then
    unzip -qo $RELEASE_NAME.zip -d watchcat_tmp && rsync -av watchcat_tmp/$RELEASE_NAME/ $INSTALL_PATH

    if [ ! -d $INSTALL_PATH/node_modules ]
    then
        cd $INSTALL_PATH && yarn --silent && cd ..
    fi

    if [ ! -d $INSTALL_PATH/bot/node_modules ]
    then
        cd $INSTALL_PATH/bot && yarn --silent && cd ..
    fi

    if which systemctl > /dev/null
    then
        cd ~/$INSTALL_PATH

        echo "Fetching panel service script from GitHub"
        if curl -L -O https://github.com/ChrisOfNormandy/server-watchcat/releases/download/$RELEASE_TAG/watchcatpanel.service
        then
            if sudo cp watchcatpanel.service /lib/systemd/system/watchcatpanel.service
            then
                echo "Copied panel service to systemd"
            else
                echo "Please run:   sudo cp watchcatpanel.service /lib/systemd/system/watchcatpanel.service"
                select yn in "Yes" "No"; do
                    case $yn in
                        Yes ) break;;
                        No ) exit;;
                    esac
                done
            fi
        else
            echo "Failed to download panel service."
        fi

        echo "Fetching bot service script from GitHub"
        if curl -L -O https://github.com/ChrisOfNormandy/server-watchcat/releases/download/$RELEASE_TAG/watchcatbot.service
        then
            if sudo cp watchcatbot.service /lib/systemd/system/watchcatbot.service
            then
                echo "Copied panel service to systemd"
            else
                echo "Please run:   sudo cp watchcatpanel.service /lib/systemd/system/watchcatbot.service"
                select yn in "Yes" "No"; do
                    case $yn in
                        Yes ) break;;
                        No ) exit;;
                    esac
                done
            fi
        else
            echo "Failed to download bot service."
        fi

        echo "Reloading systemctl daemon"

        if sudo systemctl daemon-reload
        then
            echo "systemctl daemon reload success!"
        fi

        echo "Done! Starting services."

        sudo systemctl start watchcatpanel
        sudo systemctl start watchcatbot

        echo "... and there you go! To set up logging:"
        echo "--- > sudo nano /etc/systemd/journald.conf"
        echo "--- Change '#Storage=auto' to 'Storage=persistant'"
        echo "--- 'ctrl + x' to save and exit."
        echo "---"
        echo "--- > sudo systemctl restart systemd-journald"
        echo "---"
        echo "--- ... then to view service logs:"
        echo "--- > journalctl -f -o cat -u watchcatpanel"
        echo "--- > journalctl -f -o cat -u watchcatbot"
        echo "---"
        echo "--- To start / stop / restart each service:"
        echo "--- > sudo systemctl start|stop|restart watchcatpanel"
        echo "--- > sudo systemctl start|stop|restart watchcatbot"
        echo "--- (ex: sudo systemctl restart watchcatpanel)"
        echo "---"
    fi

    rm -r ~/watchcat_tmp
    rm ~/$RELEASE_NAME.zip

    echo "--- Brought to you by ChrisOfNormandy :)"
    echo "--- https://github.com/ChrisOfNormandy"
else
    echo "Failed to download zip."
fi