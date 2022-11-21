```
sudo nano /lib/systemd/system/watchcatbot.service
sudo nano /lib/systemd/system/watchcatpanel.service

sudo systemctl daemon-reload

sudo systemctl start watchcatpanel
sudo systemctl start watchcatbot

sudo firewall-cmd --zone=public --permanent --add-port=8000/tcp
sudo firewall-cmd --reload

# 1.16.5
sudo update-java-alternatives --set /usr/lib/jvm/java-1.11.0-openjdk-amd64

# 1.18.2
sudo update-java-alternatives --set /usr/lib/jvm/java-1.17.0-openjdk-amd64
```