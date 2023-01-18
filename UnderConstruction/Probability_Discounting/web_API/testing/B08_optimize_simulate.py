# -*- coding: utf-8 -*-
"""
Simulates Trial Generation for Probability Discounting (Reward)
Flags problematic trials where r2 <= r1
Counts number of problematic trials

Created on Mon Jan  9 13:45:09 2023

@author: Mathieu.Pinger
"""

#!/usr/lib/python-virtualenvs/rewad/bin/python
# -*- coding: utf-8 -*-

#including libraries
import numpy as np                          #scientific computing
#import xlsxwriter
import pandas as pd                         #import data
#import math

#id="exp"


#------------------------------------------------------------------------------
# discounting function of PD model
def discountfun(odds, hh):
    
    PD=1/(1+hh*odds)

    return PD

#------------------------------------------------------------------------------
# generate paradigm B based on best param estimates
# class invalidRewardException(Exception):
#     "Raised when r2 < r1"
#     pass

# class invalidLossException(Exception):
#     "Raised when r2 > r1"
#     pass

def recursiveHigherOdds(r1t, p1t, beta, oddst, hh, flag=0):
    r2t=(r1t -(np.log(p1t/(1-p1t)))/beta)/discountfun(oddst,hh)
    print(r2t)
    if r2t <= r1t:
        flagt = 1
        odds_n = oddst+1
        if odds_n <= 99:
            print("Problem: R1", r1t, "R2", r2t, odds_n)
            return recursiveHigherOdds(r1t, p1t, beta, odds_n, hh, flagt)
        else:
            r2t_n = r1t + 0.01
            flagt = 1
            prob = (1-(oddst/(1+oddst)))*100
            return r2t_n, flagt, oddst, prob
    else:
        if flag == 0:
            flagt = 0
        else:
            flagt = 1
        print(flagt, r2t)
        prob = (1-(oddst/(1+oddst)))*100
        return r2t, flagt, oddst, prob


def generateParadigm(pocc, r1s, pars):
    
    beta,hh=pars

    # Änderung Mathieu: von [.1, .3, .5., .7., .9] geändert -> weniger extreme Trials
    prob_cert=[.3, .4, .5, .6, .7] #generated probs for certain choice
       
    X, Y, Z=np.meshgrid(pocc, r1s, prob_cert)
    X=X.flatten()
    Y=Y.flatten()
    Z=Z.flatten()
    trials=np.stack((X.transpose(), Y.transpose(), Z.transpose()))
    trials=trials.transpose()
    ntrials, zsp=np.shape(trials)
    p1=np.ndarray((ntrials,1))
    r1=np.ndarray((ntrials,1))
    r2=np.ndarray((ntrials,1))
    odd=np.ndarray((ntrials,1))
    occp=np.ndarray((ntrials,1))
    flag=np.ndarray((ntrials,1))
    for i in range(ntrials):
        occpt=trials[i,0]
        oddst=(1-occpt)/occpt
        #prob=occpt*100
        r1t=trials[i,1]
        p1t=trials[i,2]
        
        if r1t > 0:
            r2t, flagt, oddst, prob = recursiveHigherOdds(r1t, p1t, beta, oddst, hh)
            print("succes: R2t =", r2t, flagt)
       
        
        # # Änderung Mathieu: Problemtrials fixen
        # # correct problematic trials
        # # Reward
        # if r1t > 0:
        #     if r2t <= r1t:
        #         # flag trial als problematic
        #         flagt = 1 # 1 = Problem, 0 = kein Problem
        #         # correct
        #         r2t = r1t + 0.01
        #     else:
        #         # flag trial als fine
        #         flagt = 0
        # # Loss
        # if r1t < 0:
        #     if r2t >= r1t:
        #         # flag trial als problematic
        #         flagt = 1
        #         # correct
        #         r2t = r1t - 0.01
        
        p1[i], r1[i], r2[i], odd[i], occp[i], flag[i] = p1t, r1t, r2t, oddst, prob, flagt
        
    return r1, r2, p1, odd, occp, flag

#---------------------------------MAIN-----------------------------------------
def countProblems(parameters, task):
    # Trial Generation
    pars=parameters
    if task == "reward":      
        # Änderung Mathieu: 1 durch 50 ersetzen 
            # -> Probleme mit geringen Geldbeträgen und niedrigem Discounting
            # 1€-Entscheidungen sind sowieso nicht besonders interessant
        r1s=[5, 10, 20, 50]          # define delayed rewards used for task B
    else:
        r1s=[-5, -10, -20, -50]          # define uncertain rewards used for task B
    p_occ = np.array([.1, .25, .5, .75, .9])
    r1_B, r2_B, p_cert, odds_B, occp_B, flag = generateParadigm(p_occ, r1s, pars)
    
    # generate id for trials
    trials_id = list(range(1, len(odds_B)+1))
    
    # pandas dataframe to json
    odds_B = odds_B.flatten().tolist()
    occp_B = occp_B.flatten().tolist()
    r1_B = r1_B.flatten().tolist()
    r2_B = r2_B.flatten().tolist()
    p_cert = p_cert.flatten().tolist()
    flag = flag.flatten().tolist()
    
    outdata_df = pd.DataFrame(
        {'id': trials_id,
        'immOpt': r1_B,
        'delOpt': r2_B,
        'odds': odds_B,
        'probability': occp_B,
        'task': task,
        'p_cert': p_cert,
        'flag': flag}) # Änderung Mathieu: Problematische (gefixte) Trials werden jetzt in den Daten markiert
    
    # count problematic trials
    print(outdata_df['flag'])
    problems = outdata_df['flag'].value_counts()[1]
    print("Anzahl problematischer Trials: ", problems)

    return problems, outdata_df

# Simuliere Trial-Generierung:
    # params_test = beta, hh
    # 0.28, 0.62 = geschätzte Parameter aus echtem Run A von Mathieu
#params_test = [0.24, 2.2]
#params_test = [0.34, 0.24]
params_test = [0.28, 0.0]
problems, outdata = countProblems(params_test, "reward")



