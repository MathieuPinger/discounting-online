##### RewAD3: PD, DD and DPD
# Pilot Study: Probability Discounting only
# compare run B trials from Georgia's and Mathieu's scripts

library(tidyverse)
library(readr)

##### Data Import

# Subject ID
id_g_py <- "example"
id_g_ml <- "georgia"
id_mathieu <- "0ko4o6yky"

# Import Genereated Trials
path_g_py <- paste("../../data/", id_g_py, "_params_exp2_z.csv", sep="")
trials_g_py <- read_delim(path_georgia, ";", escape_double = FALSE, trim_ws = TRUE)

path_g_ml <- paste("../../data/", id_g_ml, "_params_exp2_z.csv", sep="")
trials_g_ml <- read_delim(path_g_ml, ";", escape_double = FALSE, trim_ws = TRUE)

path_mathieu <- paste("../../data/", id_mathieu, "_params_exp2_z.csv", sep="")
trials_mathieu <- read_csv(path_mathieu)

# Join Python and Matlab Trials, calculate differences
ml_py <- left_join(trials_g_py, trials_g_ml, by = c("immOpt", "odds", "probability", "task", "p_cert"))
ml_py['valdif'] <- ml_py['delOpt.x']-ml_py['delOpt.y']
