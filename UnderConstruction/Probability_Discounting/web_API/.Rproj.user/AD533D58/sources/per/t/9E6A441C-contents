library(tidyverse)

# import df
trialReduction <- read_csv("trialReduction.csv")
trialReductionAll <- read_csv("trialReduction_full.csv")


# graphics individual
# ll
ggplot(trialReduction, aes(x=n_trials, y = LL, group = n_trials)) +
  geom_boxplot() +
  facet_wrap(~task)

# hh
trialReduction %>% 
  filter(hh < 10) %>% 
  ggplot(aes(x=n_trials, y = hh, group = n_trials)) +
  geom_boxplot() +
  facet_wrap(~task)

# beta
trialReduction %>% 
  ggplot(aes(x=n_trials, y = beta, group = n_trials)) +
  geom_boxplot() +
  facet_wrap(~task)


# number of vp in full set
trialReductionAll %>%
  mutate(subject = as.factor(subject)) %>% 
  group_by(subject) %>% 
  summarize(count=n())

# averages per subject
trials_avg <- trialReductionAll %>% 
  mutate(subject=as.factor(subject)) %>% 
  group_by(subject, task, n_trials) %>% 
  summarize(mean_hh = mean(hh),
            sd_hh = sd(hh),
            mean_beta = mean(beta),
            sd_beta = sd(beta),
            median_LL = median(LL),
            mean_LL = mean(LL),
            sd_LL = sd(LL))

# hh plot
trials_avg %>% 
  filter(mean_hh < 10) %>% 
  ggplot(aes(x=n_trials, y = mean_hh, group = n_trials)) +
    geom_boxplot() +
    facet_wrap(~task)
# sd hh
trials_avg %>% 
  filter(mean_hh < 10) %>% 
  ggplot(aes(x=n_trials, y = sd_hh, group = n_trials)) +
  geom_boxplot() +
  facet_wrap(~task)

# LL plot
trials_avg %>% 
  ggplot(aes(x=n_trials, y = median_LL, group = n_trials)) +
  geom_boxplot() +
  facet_wrap(~task)

# LL sd
trials_avg %>% 
  ggplot(aes(x=n_trials, y = sd_LL, group = n_trials)) +
  geom_boxplot() +
  facet_wrap(~task)

# sd beta
trials_avg %>% 
  filter(mean_hh < 10) %>% 
  ggplot(aes(x=n_trials, y = sd_beta, group = n_trials)) +
  geom_boxplot() +
  facet_wrap(~task)


## LL by subject
trials_avg %>% 
  ggplot(aes(x=n_trials, y = mean_LL, group = subject, color = subject)) +
  geom_line()
