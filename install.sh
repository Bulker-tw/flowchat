# Building the front end
cd ui
npm i angular-cli -g
npm i
ng build -prod
cd ..

# Building the back end
cd service
sh install.sh
