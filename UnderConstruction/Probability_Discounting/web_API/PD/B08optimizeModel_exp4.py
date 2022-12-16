#!/usr/lib/python-virtualenvs/rewad/bin/python
# -*- coding: utf-8 -*-

#including libraries
import sys
import numpy as np                          #scientific computing
#import xlsxwriter
import json
from scipy import optimize
from IPython.core.debugger import set_trace #debugging
import pandas as pd                         #import data
#import math

#id = sys.argv[1]
id = "Mattieu"

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
        hinit= np.random.uniform(low=0.0, high=1000.0, size=None) #GK check boundaries

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

#------------------------------------------------------------------------------
# generate paradigm B based on best param estimates
def generateParadigm(pocc, r1s, pars):
    
    beta,hh=pars

    prob_cert=[.1, .3, .5, .7, .9] #generated probs for certain choice
       
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
    for i in range(ntrials):
        occpt=trials[i,0]
        oddst=(1-occpt)/occpt
        
        r1t=trials[i,1]
        p1t=trials[i,2]
#        r2t=discountfun(oddst,hh)*r1t + (np.log(p1t/(1-p1t)))/beta
        r2t=(r1t -(np.log(p1t/(1-p1t)))/beta)/discountfun(oddst,hh)
        
        p1[i], r1[i], r2[i], odd[i], occp[i]=p1t, r1t, r2t, oddst, occpt
        
    return r1, r2, p1, odd, occp

#---------------------------------MAIN-----------------------------------------
# input and output paths
rootpath = "../data/"
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

def estimateParameters(df, task):
    # create input arrays for functions
    r1 = df[["immOpt"]].to_numpy()
    r2 = df[["delOpt"]].to_numpy()
    odd = df[["odds"]].to_numpy()
    prob = df[["prob"]].to_numpy()
    a = df[["choice_relabel"]].to_numpy()
    
    # optimize model and return best param estimates
    beta, hh, LL=optimizeModel(odd, r1, r2, a) #GK 05/12/2022
    print("inferred params: beta="+np.str(beta)+ ", h="+ np.str(hh)+", logL=" + np.str(LL))

    # Trial Generation
    pars=[beta, hh] #GK update 26/10/21
    if task == "reward":      
        r1s=[1, 5, 10, 20]          # define delayed rewards used for task B
    else:
        r1s=[-1, -5, -10, -20]          # define uncertain rewards used for task B
    p_occ = np.array([.1, .25, .5, .75, .9])
    odds = [1-p_occ]/p_occ          # define odds for task B  
    r1_B, r2_B, p_cert, odds_B, occp_B = generateParadigm(p_occ, r1s, pars)
    
    # generate id for trials
    trials_id = list(range(1, len(odds_B)+1))
    
    # pandas dataframe to json
    odds_B = odds_B.flatten().tolist()
    occp_B = occp_B.flatten().tolist()
    r1_B = r1_B.flatten().tolist()
    r2_B = r2_B.flatten().tolist()
    p_cert = p_cert.flatten().tolist()
    
    outdata_df = pd.DataFrame(
        {'id': trials_id,
        'immOpt': r1_B,
        'delOpt': r2_B,
        'odds': odds_B,
        'probability': occp_B,
        'task': task,
        'p_cert': p_cert})

    params_df = pd.DataFrame(
        {'subject': id,
        'task': task,
        'beta': float(beta),
        'hh': float(hh),
        'LL': float(LL)},
        index=[0]
    )
    return outdata_df, params_df


# generate params for each task
outdata_reward, params_reward = estimateParameters(datain_reward, "reward")
outdata_loss, params_loss = estimateParameters(datain_loss, "loss")

# merge to one file
outdata = outdata_reward.append(outdata_loss)
params = params_reward.append(params_loss)

# reassign id (unique id)
outdata['id']=np.arange(len(outdata))+1
outdata = outdata.set_index('id')

# json format (exclude probabilites for json)
#json_outdata = outdata.drop(['p_imm'], axis = 1)
json_outdata = outdata.to_json(orient = "index")
json_outdata = json.loads(json_outdata)

# Open a json writer, and use the json.dumps()
# function to dump data 
with open(outputjson, 'w', encoding='utf-8') as jsonf: 
    jsonf.write(json.dumps(json_outdata, indent=4)) 
    json.dumps(json_outdata, indent=4)  

# write csv with added probabilites
outdata.to_csv(outputxlsx)

# params to json
json_params = params.to_json(orient = "records")
json_params = json.loads(json_params)

# Open a json writer, and use the json.dumps()
# function to dump data 
with open(paramsjson, 'w', encoding='utf-8') as jsonf: 
    jsonf.write(json.dumps(json_params, indent=4)) 
    json.dumps(json_params, indent=4)  


# write kappa/beta to csv
params.to_csv(outputparams)


# #now print to excel file for paradigm program
# wb = xlsxwriter.Workbook(fileout)
# ws = wb.add_worksheet('my sheet')
# ws.write_row(0, 0, ['certain outcome', 'uncertain outcome', 'odds', 'poccurrence', 'pcertain'])

# for i in range(len(r1_B)):
#     ws.write_row(i+1, 0, [r1_B[i], r2_B[i], odds_B[i], occp_B[i], p_cert[i]]) 

# wb.close()

# set_trace()


