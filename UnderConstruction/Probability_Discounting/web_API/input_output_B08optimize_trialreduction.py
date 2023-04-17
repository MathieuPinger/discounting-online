#!/usr/lib/python-virtualenvs/rewad/bin/python
# -*- coding: utf-8 -*-

#including libraries
import sys
import numpy as np                          #scientific computing
#import xlsxwriter
import json
from scipy import optimize
#from IPython.core.debugger import set_trace #debugging
import pandas as pd                         #import data
#import math

id = "5g7hl9ua7"
#id = sys.argv[1]
#id = "0ko4o6yky"
#id = "example"

# define necessary functions
#------------------------------------------------------------------------------
# optimize model
def optimizeModel(odds, r1, r2, a): 
    
    eps=1e-9    #precision of optimizer
    ninits=100  #number of initial conditions for optimization
    
    LL=np.ndarray((ninits,1))
    pars=np.ndarray((ninits,2))
    for i in range(0,ninits):
        #draw initial conditions for optimization algo:
        betainit= np.random.uniform(low=0.0, high=2.0, size=None)
        hinit= np.random.uniform(low=0.0, high=100.0, size=None) #GK check boundaries

        pars0=[betainit, hinit]
               
        minimize_method='L-BFGS-B' #optimizatin method used

        ##optimization without bound
        #result=optimize.minimize(getLikelihoodHyperbolic, pars0 ,(a,r1,r2,delay), options={'eps': eps}) 

        #bounded optimization
        bnds = ((0, 2), (0, 1000))  #upper and lower bounds used for bounded optimization
        result=optimize.minimize(fun=getNegLikelihood, 
                                 x0=pars0, 
                                 args=(a,r1,r2,odds), 
                                 method = minimize_method, 
                                 bounds = bnds,
                                 options={'eps': eps}) 
    
        pars[i,:]=result.x

        LL[i]=-getNegLikelihood(pars[i,:], a, r1, r2, odds)
    
    #find maximum and return best params and log likelihood
    arr=np.amax(LL)
    tmp=LL==arr
    for i in range(0,len(tmp)):
        if tmp[i]:
            index=i
    betawin=pars[index,0]
    hwin=pars[index,1]
    LLwin=LL[index]
     
    return betawin, hwin, LLwin

#------------------------------------------------------------------------------
# get negative log likelihood of PD model
def getNegLikelihood(pars, a, r1, r2, odds):
    
    beta,hh=pars # beta= choice param, hh= discounting param
    T=len(a)

    #model inits
    L = np.ndarray((T,1))
    V = np.ndarray((T,2))
    V[:,0]=r1.transpose()                           # values for certain choice
    discountfact=discountfun(odds,hh)*r2
    V[:,1]=discountfact.transpose()                 # values for uncertain choise
        
    #compute log-likelihood
    for t in range(T):
        Vt=V[t,a[t]-1]
        V1=V[t,0]
        V2=V[t,1]
        
        #numerical fix
        Vmax=max(V1,V2)
        V1=V1-Vmax
        V2=V2-Vmax
        Vt=Vt-Vmax
        
        ebV1=np.exp(beta*V1)
        ebV2=np.exp(beta*V2)
        
        L[t]=beta*Vt-np.log(np.sum(ebV1+ ebV2))

    logL=np.sum(L)
    return -logL


#------------------------------------------------------------------------------
# discounting function of PD model
def discountfun(odds, hh):
    
    PD=1/(1+hh*odds)

    return PD

#---------------------------------MAIN-----------------------------------------
# input and output paths
rootpath = "../data/data_PD/"
inputfile= f"{id}_exp1.csv"
paramsfile=f"{id}_kappa.csv"
paramsjsonfile=f"{id}_kappa.json"
outputfile=f"{id}_params_exp2.json"
outputfile2=f"{id}_params_exp2_z.csv"

filein= rootpath + inputfile

# output files
outputparams = rootpath + paramsfile
paramsjson = rootpath + paramsjsonfile
outputjson= rootpath + outputfile
outputxlsx= rootpath + outputfile2

# load data to pandas then convert to numpy arrays
datain = pd.read_csv(filein)
datain = datain[["immOpt", "delOpt", "odds", "prob", "choice", "task"]]

# drop missing values
datain = datain.dropna()

# replace missing values with zero
datain = datain.fillna(0)

# choice: replace "immediate" with 1 and "delayed" with 2
datain["choice_relabel"] = datain["choice"].replace({"immediate": 1,
                                                    "delayed": 2})
# split in loss and reward dfs
datain_reward = datain[datain["task"] == "reward"]
datain_loss = datain[datain["task"] == "loss"]

# #  Georgia's Code: load data 
# r1=pd.read_excel(filein, usecols=[0]).to_numpy()
# r2=pd.read_excel(filein, usecols=[1]).to_numpy()
# odd=pd.read_excel(filein, usecols=[2]).to_numpy()
# pocc=pd.read_excel(filein, usecols=[3]).to_numpy()  
# a=pd.read_excel(filein, usecols=[4]).to_numpy()    

def estimateParameters(df, task, n):
    # sample random trials
    df = df.sample(n)
    
    # create input arrays for functions
    r1 = df[["immOpt"]].to_numpy()
    r2 = df[["delOpt"]].to_numpy()
    odd = df[["odds"]].to_numpy()
    prob = df[["prob"]].to_numpy()
    a = df[["choice_relabel"]].to_numpy()
    n_trials = len(df)
    
    # optimize model and return best param estimates
    beta, hh, LL=optimizeModel(odd, r1, r2, a) #GK 05/12/2022
    print("inferred params: beta="+str(beta)+ ", h="+ str(hh)+", logL=" + str(LL) + str(task))
    
    params_df = pd.DataFrame(
        {'subject': id,
        'task': task,
        'beta': float(beta),
        'hh': float(hh),
        'LL': float(LL),
        'n_trials': n_trials},
        index=[0]
    )
    return params_df


# generate params for each task
params_all = pd.DataFrame()

# repeat parameter optimization 10 times per number of trials
for n in reversed(range(91)):
    for i in range(10):
        params_reward = estimateParameters(datain_reward, "reward", n)
        params_loss = estimateParameters(datain_loss, "loss", n)
        params = params_reward.append(params_loss)
        params_all = params_all.append(params)



